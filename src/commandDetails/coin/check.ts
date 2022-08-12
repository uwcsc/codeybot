import { container } from '@sapphire/framework';
import { User } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';
import { getCoinBalanceByUserId } from '../../components/coin';
import { getCoinEmoji } from '../../components/emojis';

// Check a user's balance
const coinCheckExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  args
): Promise<SapphireMessageResponse> => {
  // Mandatory argument is user
  const user = <User>args['user'];

  // Get coin balance
  const balance = await getCoinBalanceByUserId(user.id);
  // Show coin balance
  return `${user.username} has ${balance} Codey coins ${getCoinEmoji()}.`;
};

export const coinCheckCommandDetails: CodeyCommandDetails = {
  name: 'check',
  aliases: ['c'],
  description: "Check a user's coin balance.",
  detailedDescription: `**Examples:**
\`${container.botPrefix}coin check @Codey\`
\`${container.botPrefix}coin c @Codey\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: "Getting user's coin balance...",
  executeCommand: coinCheckExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,

  options: [
    {
      name: 'user',
      description: 'The user to check the balance of,',
      type: CodeyCommandOptionType.USER,
      required: true
    }
  ],
  subcommandDetails: {}
};
