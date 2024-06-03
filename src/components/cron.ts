import { CronJob } from 'cron';
import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { ChannelType } from 'discord-api-types/v10';
import _ from 'lodash';
import fetch from 'node-fetch';
import { alertMatches } from '../components/coffeeChat';
import { alertUsers } from './officeOpenDM';
import { vars } from '../config';
import { DEFAULT_EMBED_COLOUR } from '../utils/embeds';
import { getMatch, writeHistoricMatches } from '../components/coffeeChat';
import {
  adjustCoinBalanceByUserId,
  BonusType,
  coinBonusMap,
  getCoinLeaderboard,
  UserCoinEntry,
} from './coin';
import { getInterviewers } from './interviewer';
import {
  getSuggestionPrintout,
  getSuggestions,
  SuggestionState,
  updateSuggestionState,
} from './suggestion';
import { updateMemberRole, getRoleName, loadRoleMembers } from '../utils/roles';
import { CodeyUserError } from '../codeyUserError';
import { logger } from '../logger/default';

const NOTIF_CHANNEL_ID: string = vars.NOTIF_CHANNEL_ID;
const OFFICE_STATUS_CHANNEL_ID: string = vars.OFFICE_STATUS_CHANNEL_ID;
const OFFICE_HOURS_STATUS_API = 'https://csclub.uwaterloo.ca/~webcom/office-status.json';
const TARGET_GUILD_ID: string = vars.TARGET_GUILD_ID;
const NUMBER_USERS_TO_ASSIGN_ROLE = 20;
const CODEY_COIN_ROLES: string[] = [
  vars.CODEY_COIN_T5_ROLE_ID,
  vars.CODEY_COIN_T10_ROLE_ID,
  vars.CODEY_COIN_T20_ROLE_ID,
];
const CODEY_COIN_INTERVALS: number[] = [5, 10, 20];

// The last known status of the office
//  false if closed
//  true if open
let office_last_status = false;

export const initCrons = async (client: Client): Promise<void> => {
  createSuggestionCron(client).start();
  createBonusInterviewerListCron().start();
  createCoffeeChatCron(client).start();
  createOfficeStatusCron(client).start();
  assignCodeyRoleForLeaderboard(client).start();
};

interface officeStatus {
  status: number;
  time: number;
}
// Updates office status based on webcom API
export const createOfficeStatusCron = (client: Client): CronJob =>
  new CronJob('0 */10 * * * *', async function () {
    const response = (await (await fetch(OFFICE_HOURS_STATUS_API)).json()) as officeStatus;
    const messageChannel = client.channels.cache.get(OFFICE_STATUS_CHANNEL_ID);

    if (!messageChannel) {
      throw 'Bad channel ID';
    } else if (messageChannel.type === ChannelType.GuildText) {
      // if there is an emoji, prune it, otherwise leave name as is
      const curName =
        (messageChannel as TextChannel).name.replace(/\p{Extended_Pictographic}+/gu, '') +
        //discord channel names don't accept :emoji: so we have to use actual unicode
        (response['status'] == 1 ? '✅' : response['status'] == 0 ? '❌' : '❓');
      await (messageChannel as TextChannel).setName(curName);
      const time = Math.floor(response['time']);
      const topic = `Last updated at <t:${time}:F> for you (<t:${time}:R>)`;
      await (messageChannel as TextChannel).setTopic(topic).catch(logger.error);
    } else {
      throw 'Bad channel type';
    }

    if (office_last_status == false && response['status'] == 1) {
      // The office was closed and is now open
      // Send all the users with the "Office Ping" role a DM:
      // Get all users with "Office Ping" role
      await alertUsers();
      office_last_status = true;
    } else if (office_last_status == true && response['status'] == 0) {
      // the office was open and is now closed
      office_last_status = false;
    }
  });

// Checks for new suggestions every min
export const createSuggestionCron = (client: Client): CronJob =>
  new CronJob('0 */1 * * * *', async function () {
    const createdSuggestions = await getSuggestions(SuggestionState.Created);
    const createdSuggestionIds = createdSuggestions.map((a) => Number(a.id));
    if (!_.isEmpty(createdSuggestionIds)) {
      const messageChannel = client.channels.cache.get(NOTIF_CHANNEL_ID);

      if (!messageChannel) {
        throw 'Bad channel ID';
      } else if (messageChannel.type === ChannelType.GuildText) {
        // construct embed for display
        const output = await getSuggestionPrintout(createdSuggestions);
        const title = 'New Suggestions';
        const outEmbed = new EmbedBuilder()
          .setColor(DEFAULT_EMBED_COLOUR)
          .setTitle(title)
          .setDescription(output);
        (messageChannel as TextChannel).send({ embeds: [outEmbed] });
        // Update states
        await updateSuggestionState(createdSuggestionIds);
      } else {
        throw 'Bad channel type';
      }
    }
  });

// Gives Codey coin bonus to those on the interviewer list at 1:00 am UTC
export const createBonusInterviewerListCron = (): CronJob =>
  new CronJob('0 0 1 * * *', async function () {
    const activeInterviewers = await getInterviewers(null);
    const bonus = coinBonusMap.get(BonusType.InterviewerList);
    if (!bonus) {
      throw 'BonusType.InterviewerList does not exist in coinBonusMap';
    }
    activeInterviewers.forEach(async (interviewer) => {
      await adjustCoinBalanceByUserId(interviewer.user_id, bonus.amount, bonus.event);
    });
  });

// Match coffeechat users every week on Friday
export const createCoffeeChatCron = (client: Client): CronJob =>
  new CronJob('0 0 14 * * 5', async function () {
    const matches = await getMatch();

    if (!matches.length) throw `Not enough members with coffee chat role to generate matches.`;
    else {
      await alertMatches(matches);
      await writeHistoricMatches(matches);
      const messageChannel = client.channels.cache.get(NOTIF_CHANNEL_ID);
      if (!messageChannel) {
        throw 'Bad channel ID';
      } else if (messageChannel.type === ChannelType.GuildText) {
        (messageChannel as TextChannel).send(`Sent ${matches.length} match(es).`);
      } else {
        throw 'Bad channel type';
      }
    }
  });

// Gives Codey coin role to those on the leaderboard list everyday
export const assignCodeyRoleForLeaderboard = (client: Client): CronJob =>
  new CronJob('0 0 0 */1 * *', async function () {
    const guild = client.guilds.resolve(TARGET_GUILD_ID);
    if (!guild) {
      throw new CodeyUserError(undefined, 'guild not found');
    }

    const members = await guild.members.fetch();
    const leaderboard: UserCoinEntry[] = [];
    let fetchAttempts = 0;

    // Fetch leaderboard until we have enough human members to assign roles to
    while (leaderboard.length < NUMBER_USERS_TO_ASSIGN_ROLE) {
      const leaderboardBuffer = await getCoinLeaderboard(
        NUMBER_USERS_TO_ASSIGN_ROLE,
        fetchAttempts * NUMBER_USERS_TO_ASSIGN_ROLE,
      );

      if (leaderboardBuffer.length <= 0) {
        break;
      }

      for (const entry of leaderboardBuffer) {
        if (members.get(entry.user_id)?.user?.bot) {
          continue;
        }
        leaderboard.push(entry);
        if (leaderboard.length >= NUMBER_USERS_TO_ASSIGN_ROLE) {
          break;
        }
      }

      fetchAttempts++;
    }

    // Create slices of the leaderboard to assign roles to
    const topSlices: string[][] = [];
    for (let i = 0; i < CODEY_COIN_INTERVALS.length; i++) {
      topSlices.push(
        leaderboard
          // Slice the leaderboard into intervals -> {[0,i), [i-1, i), [i-1, end|i)}
          .slice(i === 0 ? 0 : CODEY_COIN_INTERVALS[i - 1], CODEY_COIN_INTERVALS[i])
          .map((entry) => entry.user_id),
      );
    }

    CODEY_COIN_ROLES.forEach(async (roleId, idx) => {
      const roleName: string = await getRoleName(roleId);
      const guildMembersPreviousRole = await loadRoleMembers(roleId);
      const previousIds: Set<string> = new Set(guildMembersPreviousRole.map((member) => member.id));
      const leaderboardIds = new Set(topSlices[idx]);

      // Removing role from former members
      guildMembersPreviousRole.forEach(async (member) => {
        if (member && !leaderboardIds.has(member.id)) {
          await updateMemberRole(member, roleName, false);
        }
      });

      // Adding role to new members
      leaderboardIds.forEach(async (user_id) => {
        const memberToUpdate = members.get(user_id);
        if (memberToUpdate && !previousIds.has(user_id)) {
          await updateMemberRole(memberToUpdate, roleName, true);
        }
      });
    });
  });
