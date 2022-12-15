// Sapphire Specific:
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { ApplyOptions } from '@sapphire/decorators';
// Sapphire Specific:
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { Args, container } from '@sapphire/framework';
// Sapphire Specific:
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import {
  SubCommandPluginCommand,
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  SubCommandPluginCommandOptions,
} from '@sapphire/plugin-subcommands';
import { Message, MessageEmbed } from 'discord.js';
import _ from 'lodash';
import {
  addSuggestion,
  getAvailableStatesString,
  getSuggestions,
  Suggestion,
  SuggestionState,
  suggestionStatesReadable,
  updateSuggestionState,
} from '../../components/suggestion';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';

const RESULTS_PER_PAGE = 15;

@ApplyOptions<SubCommandPluginCommandOptions>({
  aliases: ['suggestions', 'suggest'],
  description: 'Handle suggestion functions.',
  detailedDescription: `This command will forward a suggestion to the CSC Discord Mods. \
Please note that your suggestion is not anonymous, your Discord username and ID will be recorded. \
If you don't want to make a suggestion in public, you could use this command via a DM to Codey instead.
**Examples:**
\`${container.botPrefix}suggestion I want a new Discord channel named #hobbies.\``,
  subCommands: [{ input: 'list', default: true }, 'update', 'create'],
})
export class SuggestionCommand extends SubCommandPluginCommand {
  public async create(message: Message, args: Args): Promise<Message> {
    const suggestion = await args.rest('string').catch(() => false);
    if (typeof suggestion === 'boolean') {
      return message.reply('please add a suggestion');
    }
    // Add suggestion
    await addSuggestion(message.author.id, message.author.username, suggestion);
    //Confirm suggestion was taken
    return message.reply('Codey has received your suggestion.');
  }

  private async getSuggestionDisplayInfo(suggestion: Suggestion) {
    return `**${suggestion['id']}** | ${suggestionStatesReadable[suggestion['state']]} | ${
      suggestion['suggestion']
    }\n\n`;
  }

  async list(message: Message, args: Args): Promise<Message | void> {
    if (!message.member?.permissions.has('ADMINISTRATOR')) return;

    const state = args.finished ? null : (await args.rest('string')).toLowerCase();
    //validate state
    if (state !== null && !(state.toLowerCase() in suggestionStatesReadable))
      return message.reply(
        `you entered an invalid state. Please enter one of ${getAvailableStatesString()}.`,
      );
    // query suggestions
    const suggestions = await getSuggestions(state);
    // only show up to page limit
    const suggestionsToShow = suggestions.slice(0, RESULTS_PER_PAGE);
    // get information from each suggestion
    const suggestionsInfo = await Promise.all(
      suggestionsToShow.map((suggestion) => this.getSuggestionDisplayInfo(suggestion)),
    );

    // construct embed for display
    const title = state ? `${suggestionStatesReadable[state]} Suggestions` : 'Suggestions';
    const outEmbed = new MessageEmbed().setColor(DEFAULT_EMBED_COLOUR).setTitle(title);
    outEmbed.setDescription(suggestionsInfo.join(''));
    return message.channel.send({ embeds: [outEmbed] });
  }

  async update(message: Message, args: Args): Promise<Message | void> {
    if (!message.member?.permissions.has('ADMINISTRATOR')) return;

    const state = (
      await args.pick('string').catch(() => `please enter a valid suggestion state.`)
    ).toLowerCase();
    const ids = await args.rest('string').catch(() => `please enter valid suggestion IDs.`);
    const suggestionIds = ids.split(' ').map((a) => Number(a));
    //validate state
    if (!(state in suggestionStatesReadable))
      return message.reply(
        `you entered an invalid state. Please enter one of ${getAvailableStatesString()}.`,
      );
    // validate each id after first word
    if (_.some(suggestionIds, isNaN)) {
      return message.reply(`you entered an invalid ID. Please enter numbers only.`);
    }

    const suggestionState = state as SuggestionState;

    // Update states
    await updateSuggestionState(suggestionIds, suggestionState);

    // construct embed for display
    const title = `Suggestions Updated To ${suggestionStatesReadable[state]} State`;
    const outEmbed = new MessageEmbed().setColor(DEFAULT_EMBED_COLOUR).setTitle(title);
    outEmbed.setDescription(suggestionIds.join(', '));
    return message.channel.send({ embeds: [outEmbed] });
  }
}

export default SuggestionCommand;
