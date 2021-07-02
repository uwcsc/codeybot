import { updateSuggestionCron } from './suggestions';
import { TextChannel } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';

const NOTIF_CHANNEL_ID_OLD: string = process.env.NOTIF_CHANNEL_ID_OLD || '.';

const CronJob = require('cron').CronJob;

// Checks for new suggestions every min
export const createSuggestionCron = (client: CommandoClient) =>
  new CronJob('0 */1 * * * *', async function () {
    const isSuggestionsChanged = await updateSuggestionCron();
    if (isSuggestionsChanged) {
      const messageChannel = client.channels.cache.get(NOTIF_CHANNEL_ID_OLD);
      if (messageChannel == undefined) {
        throw 'Bad Channel';
      } else if (messageChannel.type === 'text') {
        (messageChannel as TextChannel).send(`New suggestions exist.`);
      } else {
        throw 'Bad Channel Type';
      }
    }
  });
