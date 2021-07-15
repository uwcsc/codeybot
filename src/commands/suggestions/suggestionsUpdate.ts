import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';

import { AdminCommand } from '../../utils/commands';
import {
  suggestionStatesReadable,
  getAvailableStatesString,
  updateSuggestionState
} from '../../components/suggestions';
import { EMBED_COLOUR } from '../../utils/embeds';
import { parseStateArg, validateUpdate } from './utils';

const RESULTS_PER_PAGE = 6;

class SuggestionsUpdateCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'suggestions-update',
      aliases: ['suggestions-update', 'suggestion-update'],
      group: 'suggestions',
      memberName: 'update',
      args: [
        {
          key: 'state',
          prompt: `enter one of ${getAvailableStatesString()} before your IDs.`,
          type: 'string',
          default: '',
          validate: validateUpdate,
          parse: parseStateArg
        }
      ],
      description: 'Updates a list of suggestion states.',
      examples: [
        `${client.commandPrefix}suggestions-update actionable 1 2 3`,
        `${client.commandPrefix}suggestion-update created 99`
      ]
    });
  }

  async onRun(message: CommandoMessage, args: { value: string }): Promise<Message> {
    const { value } = args;
    const values = value.split('\\s+');
    const state = values[0];
    const ids = values.slice(1);
    const suggestionIds = ids.map((a) => Number(a));

    // Update states
    await updateSuggestionState(suggestionIds);

    // construct embed for display
    const title = `Suggestions Updated To ${suggestionStatesReadable[state]} State`;
    const outEmbed = new MessageEmbed().setColor(EMBED_COLOUR).setTitle(title);
    outEmbed.setDescription(ids.join(' '));
    return message.channel.send(outEmbed);
  }
}

export default SuggestionsUpdateCommand;
