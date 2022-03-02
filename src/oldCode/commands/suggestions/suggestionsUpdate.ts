import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';

import { AdminCommand } from '../../utils/commands';
import {
  suggestionStatesReadable,
  getAvailableStatesString,
  updateSuggestionState,
  SuggestionState
} from '../../components/suggestions';
import { EMBED_COLOUR } from '../../utils/embeds';
import { parseStateArg, validateState, validateIDs } from './utils';

class SuggestionsUpdateCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'suggestions-update',
      aliases: ['suggestion-update'],
      group: 'suggestions',
      memberName: 'update',
      args: [
        {
          key: 'state',
          prompt: `enter one of ${getAvailableStatesString()}.`,
          type: 'string',
          validate: validateState,
          parse: parseStateArg
        },
        {
          key: 'ids',
          prompt: `enter suggestion IDs seperated by spaces.`,
          type: 'string',
          validate: validateIDs
        }
      ],
      description: 'Updates a list of suggestion states.',
      examples: [
        `${client.commandPrefix}suggestions-update actionable 1 2 3`,
        `${client.commandPrefix}suggestion-update created 99`
      ]
    });
  }

  async onRun(message: CommandoMessage, args: { state: string; ids: string }): Promise<Message> {
    const { state, ids } = args;
    const suggestionIds = ids.split(' ').map((a) => Number(a));
    const suggestionState = state as SuggestionState;

    // Update states
    await updateSuggestionState(suggestionIds, suggestionState);

    // construct embed for display
    const title = `Suggestions Updated To ${suggestionStatesReadable[state]} State`;
    const outEmbed = new MessageEmbed().setColor(EMBED_COLOUR).setTitle(title);
    outEmbed.setDescription(suggestionIds.join(', '));
    return message.channel.send(outEmbed);
  }
}

export default SuggestionsUpdateCommand;
