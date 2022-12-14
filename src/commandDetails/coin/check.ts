import { container } from '@sapphire/framework';
import { User } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  getUserFromMessage,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { getCoinBalanceByUserId } from '../../components/coin';
import { getCoinEmoji } from '../../components/emojis';
import { pluralize } from '../../utils/pluralize';

// Check a user's balance
const coinCheckExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  let user: User;
  let displayMessage: string;

  // use the caller as a default user if no argument is provided
  if (args['user']) {
    user = <User>args['user'];
    displayMessage = `${user.username} has`;
  } else {
    user = getUserFromMessage(messageFromUser);
    displayMessage = `You have`;
  }
  // Get coin balance
  let balance: number;
  try {
    balance = await getCoinBalanceByUserId(user.id);
  } catch (e) {
    return `Could not fetch the user's balance, contact a mod for help`;
  }

  // Show coin balance
  return `${displayMessage} ${balance} Codey ${pluralize('coin', balance)} ${getCoinEmoji()}.`;
};

export const coinCheckCommandDetails: CodeyCommandDetails = {
  name: 'check',
  aliases: ['c', 'b', 'balance', 'bal'],
  description: "Check a user's coin balance.",
  detailedDescription: `**Examples:**
\`${container.botPrefix}coin check @Codey\`
\`${container.botPrefix}coin c @Codey\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: "Getting user's coin balance...",
  executeCommand: coinCheckExecuteCommand,
  options: [
    {
      name: 'user',
      description: 'The user to check the balance of.',
      type: CodeyCommandOptionType.USER,
      required: false,
    },
  ],
  subcommandDetails: {},
};
