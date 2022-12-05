import { CronJob } from 'cron';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import _ from 'lodash';
import fetch from 'node-fetch';
import { alertMatches } from '../components/coffeeChat';
import { alertUsers } from './officeOpenDM';
import { vars } from '../config';
import { DEFAULT_EMBED_COLOUR } from '../utils/embeds';
import { getMatch, writeHistoricMatches } from '../components/coffeeChat';
import { adjustCoinBalanceByUserId, BonusType, coinBonusMap } from './coin';
import { getInterviewers } from './interviewer';
import {
  getSuggestionPrintout,
  getSuggestions,
  SuggestionState,
  updateSuggestionState,
} from './suggestion';

const NOTIF_CHANNEL_ID: string = vars.NOTIF_CHANNEL_ID;
const OFFICE_STATUS_CHANNEL_ID: string = vars.OFFICE_STATUS_CHANNEL_ID;
const OFFICE_HOURS_STATUS_API = 'https://csclub.ca/office-status/json';

// The last known status of the office
//  false if closed
//  true if open
let office_last_status = false;

export const initCrons = async (client: Client): Promise<void> => {
  createSuggestionCron(client).start();
  createBonusInterviewerListCron().start();
  createCoffeeChatCron(client).start();
  createOfficeStatusCron(client).start();
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
    } else if (messageChannel.type === 'GUILD_TEXT') {
      // if there is an emoji, prune it, otherwise leave name as is
      const curName =
        (messageChannel as TextChannel).name.replace(/\p{Extended_Pictographic}+/gu, '') +
        //discord channel names don't accept :emoji: so we have to use actual unicode
        (response['status'] == 1 ? '✅' : response['status'] == 0 ? '❌' : '❓');
      await (messageChannel as TextChannel).setName(curName);
      const time = Math.floor(response['time']);
      const topic = `Last updated at <t:${time}:F> for you (<t:${time}:R>)`;
      await (messageChannel as TextChannel).setTopic(topic).catch(console.error);
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
      } else if (messageChannel.type === 'GUILD_TEXT') {
        // construct embed for display
        const output = await getSuggestionPrintout(createdSuggestions);
        const title = 'New Suggestions';
        const outEmbed = new MessageEmbed()
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
    await alertMatches(matches);
    await writeHistoricMatches(matches);

    const messageChannel = client.channels.cache.get(NOTIF_CHANNEL_ID);
    if (!messageChannel) {
      throw 'Bad channel ID';
    } else if (messageChannel.type === 'GUILD_TEXT') {
      (messageChannel as TextChannel).send(`Sent ${matches.length} match(es).`);
    } else {
      throw 'Bad channel type';
    }
  });
