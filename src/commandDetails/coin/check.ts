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
  messageFromUser,
  args
): Promise<SapphireMessageResponse> => {
  // use the caller as a default user if no argument is provided
  const user = <User>args['user'] ?? messageFromUser.member?.user;
  // Get coin balance
  let balance: number;
  try {
    balance = await getCoinBalanceByUserId(user.id);
  } catch (e) {
    return `Could not fetch the user's balance, contact a mod for help`;
  }
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
      required: false
    }
  ],
  subcommandDetails: {}
};
