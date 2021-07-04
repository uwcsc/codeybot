import { getSuggestions, getSuggestionPrintout, updateSuggestionCron } from './suggestions';
import { TextChannel, MessageEmbed } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import { CronJob } from 'cron';
import { EMBED_COLOUR } from '../utils/embeds';

const MOD_CHANNEL_ID: string = process.env.MOD_CHANNEL_ID || '.';

// Checks for new suggestions every min
export const createSuggestionCron = (client: CommandoClient): CronJob =>
  new CronJob('0 */1 * * * *', async function () {
    const createdSuggestions = await getSuggestions('created');
    const createdSuggestionIds = createdSuggestions.map((a) => a.id).map(Number);
    if (createdSuggestionIds != undefined && createdSuggestionIds.length != 0) {
      const messageChannel = client.channels.cache.get(MOD_CHANNEL_ID);
      if (messageChannel == undefined) {
        throw 'Bad Channel from env file';
      } else if (messageChannel.type === 'text') {
        await updateSuggestionCron(createdSuggestionIds);
        const output = await getSuggestionPrintout(createdSuggestions);
        // construct embed for display
        const title = 'New Suggestions';
        const outEmbed = new MessageEmbed().setColor(EMBED_COLOUR).setTitle(title).setDescription(output);
        (messageChannel as TextChannel).send(outEmbed);
      } else {
        throw 'Bad Channel Type';
      }
    }
  });
