import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import _ from 'lodash';

import { BaseCommand, AdminCommand } from '../../utils/commands';
import { availableLists, getAvailableListsString, getSuggestions, Suggestion } from '../../components/suggestions';
import { EMBED_COLOUR } from '../../utils/embeds';
import { parseListArg, validateListArg } from './utils';

const RESULTS_PER_PAGE = 6;

class SuggestionsListCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'suggestions-list',
      aliases: ['suggestions', 'suggestion-list', 'suggestions-list'],
      group: 'suggestions',
      memberName: 'list',
      args: [
        {
          key: 'list',
          prompt: `enter one of ${getAvailableListsString()}.`,
          type: 'string',
          default: '',
          validate: validateListArg,
          parse: parseListArg
        }
      ],
      description: 'Shows you a list of suggestions.',
      examples: ['.suggestions', '.suggestions-list actionable']
    });
  }

  private async getSuggestionDisplayInfo(suggestion: Suggestion) {
    return '**' + suggestion['id'] + '** | ' + suggestion['state'] + ' | ' + suggestion['suggestion'] + '\n\n';
  }

  async onRun(message: CommandoMessage, args: { list: string }): Promise<Message> {
    const { list } = args;

    // query suggestions
    const suggestions = await getSuggestions(args.list.toLowerCase());
    // only show up to page limit
    const suggestionsToShow = suggestions.slice(0, RESULTS_PER_PAGE);
    // get information from each suggestion
    const suggestionsInfo = await Promise.all(
      suggestionsToShow.map((suggestion) => this.getSuggestionDisplayInfo(suggestion))
    );

    // construct embed for display
    const title = list ? `${availableLists[list.toLowerCase()]} Suggestions` : 'Suggestions';
    const outEmbed = new MessageEmbed().setColor(EMBED_COLOUR).setTitle(title);
    outEmbed.setDescription(suggestionsInfo.join(''));
    return message.channel.send(outEmbed);
  }
}

export default SuggestionsListCommand;
