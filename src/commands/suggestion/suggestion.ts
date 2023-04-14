import { CodeyUserError } from './../../codeyUserError';
// Sapphire Specific:
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { Args, container } from '@sapphire/framework';
// Sapphire Specific:
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { Subcommand } from '@sapphire/plugin-subcommands';
import { Message, EmbedBuilder, PermissionsBitField } from 'discord.js';
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

export class SuggestionCommand extends Subcommand {
  public constructor(context: Subcommand.Context, options: Subcommand.Options) {
    super(context, {
      ...options,
      name: 'suggestions',
      aliases: ['suggest'],
      description: 'Handle suggestion functions.',
      detailedDescription: `This command will forward a suggestion to the CSC Discord Mods. \
Please note that your suggestion is not anonymous, your Discord username and ID will be recorded. \
If you don't want to make a suggestion in public, you could use this command via a DM to Codey instead.
**Examples:**
\`${container.botPrefix}suggestion I want a new Discord channel named #hobbies.\``,
      subcommands: [
        { name: 'list', messageRun: 'list', default: true },
        { name: 'update', messageRun: 'update' },
        { name: 'create', messageRun: 'create' },
      ],
    });
  }

  public async create(message: Message, args: Args): Promise<Message | void> {
    try {
      const suggestion = await args.rest('string').catch(() => false);
      if (typeof suggestion === 'boolean') {
        throw new CodeyUserError(message, 'please add a suggestion');
      }
      // Add suggestion
      await addSuggestion(message.author.id, message.author.username, suggestion);
      //Confirm suggestion was taken
      return message.reply('Codey has received your suggestion.');
    } catch (e) {
      if (e instanceof CodeyUserError) {
        e.sendToUser();
      }
    }
  }

  private async getSuggestionDisplayInfo(suggestion: Suggestion) {
    return `**${suggestion['id']}** | ${suggestionStatesReadable[suggestion['state']]} | ${
      suggestion['suggestion']
    }\n\n`;
  }

  async list(message: Message, args: Args): Promise<Message | void> {
    if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const state = args.finished ? null : (await args.rest('string')).toLowerCase();
    //validate state
    if (state !== null && !(state.toLowerCase() in suggestionStatesReadable))
      throw new CodeyUserError(
        message,
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
    const outEmbed = new EmbedBuilder().setColor(DEFAULT_EMBED_COLOUR).setTitle(title);
    outEmbed.setDescription(suggestionsInfo.join(''));
    return message.channel.send({ embeds: [outEmbed] });
  }

  async update(message: Message, args: Args): Promise<Message | void> {
    try {
      if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) return;

      const state = (
        await args.pick('string').catch(() => {
          throw new CodeyUserError(message, `please enter a valid suggestion state.`);
        })
      ).toLowerCase();
      const ids = await args.rest('string').catch(() => {
        throw new CodeyUserError(message, `please enter valid suggestion IDs.`);
      });
      const suggestionIds = ids.split(' ').map((a) => Number(a));
      //validate state
      if (!(state in suggestionStatesReadable))
        throw new CodeyUserError(
          message,
          `you entered an invalid state. Please enter one of ${getAvailableStatesString()}.`,
        );
      // validate each id after first word
      if (_.some(suggestionIds, isNaN)) {
        throw new CodeyUserError(message, `you entered an invalid ID. Please enter numbers only.`);
      }

      const suggestionState = state as SuggestionState;

      // Update states
      await updateSuggestionState(suggestionIds, suggestionState);

      // construct embed for display
      const title = `Suggestions Updated To ${suggestionStatesReadable[state]} State`;
      const outEmbed = new EmbedBuilder().setColor(DEFAULT_EMBED_COLOUR).setTitle(title);
      outEmbed.setDescription(suggestionIds.join(', '));
      return message.channel.send({ embeds: [outEmbed] });
    } catch (e) {
      if (e instanceof CodeyUserError) {
        e.sendToUser();
      }
    }
  }
}

export default SuggestionCommand;
