import { getSuggestionIdsByState, updateSuggestionCron } from './suggestions';
import { TextChannel } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import { CronJob } from 'cron';

const MOD_CHANNEL_ID: string = process.env.MOD_CHANNEL_ID || '.';

// Checks for new suggestions every min
export const createSuggestionCron = (client: CommandoClient): CronJob =>
  new CronJob('0 */1 * * * *', async function () {
    const createdSuggestionIds = await getSuggestionIdsByState();
    if (createdSuggestionIds != undefined && createdSuggestionIds.length != 0) {
      const messageChannel = client.channels.cache.get(MOD_CHANNEL_ID);
      if (messageChannel == undefined) {
        throw 'Bad Channel from env file';
      } else if (messageChannel.type === 'text') {
        await updateSuggestionCron(createdSuggestionIds);
        (messageChannel as TextChannel).send(`New suggestions exist with IDs:\n${createdSuggestionIds.join()}`);
      } else {
        throw 'Bad Channel Type';
      }
    }
  });
