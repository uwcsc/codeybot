import { Message, MessageEmbed } from 'discord.js';
import { Args, Command} from '@sapphire/framework';

import {
  suggestionStatesReadable,
  getAvailableStatesString,
  getSuggestionPrintout,
  addSuggestion,
  updateSuggestionState,
  getSuggestions,
  Suggestion
} from '../../components/suggestions';
import { EMBED_COLOUR } from '../../utils/embeds';
import { BOT_PREFIX } from '../../bot';
import { getEmojiByName } from '../../components/emojis';
import _ from 'lodash';

const RESULTS_PER_PAGE = 6;

class SuggestionsListCommand extends Command {
  constructor(context: Command.Context) {
    super(context, {
      name: 'suggestions-list',
      aliases: ['suggestions', 'suggestion-list', 'suggest-list'],
      fullCategory: ['fun'],
      description: 'Shows you a list of suggestions.',
      detailedDescription: `Example: ${BOT_PREFIX} suggestions`
    })
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

  async messageRun(message: Message, args: Args) : Promise<Message> {
    
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
