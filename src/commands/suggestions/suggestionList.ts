import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';

import { AdminCommand } from '../../utils/commands';
import {
  suggestionStatesReadable,
  getAvailableStatesString,
  getSuggestions,
  Suggestion
} from '../../components/suggestions';
import { EMBED_COLOUR } from '../../utils/embeds';
import { parseStateArg, validateState } from './utils';

const RESULTS_PER_PAGE = 6;

class SuggestionsListCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'suggestions-list',
      aliases: ['suggestions', 'suggestion-list', 'suggestions-list', 'suggest-list'],
      group: 'suggestions',
      memberName: 'list',
      args: [
        {
          key: 'state',
          prompt: `enter one of ${getAvailableStatesString()}.`,
          type: 'string',
          default: '',
          validate: validateState,
          parse: parseStateArg
        }
      ],
      description: 'Shows you a list of suggestions.',
      examples: [`${client.commandPrefix}suggestions`, `${client.commandPrefix}suggestions-list actionable`]
    });
  }

  private async getSuggestionDisplayInfo(suggestion: Suggestion) {
    return (
      '**' +
      suggestion['id'] +
      '** | ' +
      suggestionStatesReadable[suggestion['state']] +
      ' | ' +
      suggestion['suggestion'] +
      '\n\n'
    );
  }

  async onRun(message: CommandoMessage, args: { state: string }): Promise<Message> {
    const { state } = args;

    // query suggestions
    const suggestions = await getSuggestions(state);
    // only show up to page limit
    const suggestionsToShow = suggestions.slice(0, RESULTS_PER_PAGE);
    // get information from each suggestion
    const suggestionsInfo = await Promise.all(
      suggestionsToShow.map((suggestion) => this.getSuggestionDisplayInfo(suggestion))
    );

    // construct embed for display
    const title = state ? `${suggestionStatesReadable[state]} Suggestions` : 'Suggestions';
    const outEmbed = new MessageEmbed().setColor(EMBED_COLOUR).setTitle(title);
    outEmbed.setDescription(suggestionsInfo.join(''));
    return message.channel.send(outEmbed);
  }
}

export default SuggestionsListCommand;
