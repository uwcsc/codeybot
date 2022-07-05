import { container } from '@sapphire/framework';
import { CronJob } from 'cron';
import { MessageEmbed, TextChannel } from 'discord.js';
import _ from 'lodash';
import { CoffeeChatCommand } from '../commands/coffeeChat/coffeeChat';
import { vars } from '../config';
import { EMBED_COLOUR } from '../utils/embeds';
import { getMatch, writeHistoricMatches } from './coffeeChat';
import { adjustCoinBalanceByUserId, BonusType, coinBonusMap } from './coin';
import { getInterviewers } from './interviewer';
import { getSuggestionPrintout, getSuggestions, SuggestionState, updateSuggestionState } from './suggestion';

const NOTIF_CHANNEL_ID: string = vars.NOTIF_CHANNEL_ID;

// Checks for new suggestions every min
export const createSuggestionCron = (): CronJob =>
  new CronJob('0 */1 * * * *', async function () {
    const { client } = container;
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
        const outEmbed = new MessageEmbed().setColor(EMBED_COLOUR).setTitle(title).setDescription(output);
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
export const createCoffeeChatCron = (): CronJob =>
  new CronJob('0 0 14 * * 5', async function () {
    const { client } = container;

    const matches = await getMatch();
    await CoffeeChatCommand.alertMatches(matches);
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
