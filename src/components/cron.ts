import { SuggestionState, getSuggestions, getSuggestionPrintout, updateSuggestionState } from './suggestions';
import { TextChannel, MessageEmbed } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import { CronJob } from 'cron';
import { EMBED_COLOUR } from '../utils/embeds';
import { getInterviewers } from './interview';
import { coinBonusMap, BonusType, adjustCoinBalanceByUserId } from './coin';
import _ from 'lodash';
import { vars } from '../config';

const NOTIF_CHANNEL_ID: string = vars.NOTIF_CHANNEL_ID;

// Checks for new suggestions every min
export const createSuggestionCron = (client: CommandoClient): CronJob =>
  new CronJob('0 */1 * * * *', async function () {
    const createdSuggestions = await getSuggestions(SuggestionState.Created);
    const createdSuggestionIds = createdSuggestions.map((a) => Number(a.id));
    if (!_.isEmpty(createdSuggestionIds)) {
      const messageChannel = client.channels.cache.get(NOTIF_CHANNEL_ID);

      if (!messageChannel) {
        throw 'Bad channel ID';
      } else if (messageChannel.type === 'text') {
        // construct embed for display
        const output = await getSuggestionPrintout(createdSuggestions);
        const title = 'New Suggestions';
        const outEmbed = new MessageEmbed().setColor(EMBED_COLOUR).setTitle(title).setDescription(output);
        (messageChannel as TextChannel).send(outEmbed);
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
