import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandResponseType,
  getUserIdFromMessage,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';
import { getCoinBalanceByUserId } from '../../components/coin';
import { getCoinEmoji } from '../../components/emojis';

// Get coin balance
const coinBalanceExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  _args
): Promise<SapphireMessageResponse> => {
  const balance = await getCoinBalanceByUserId(getUserIdFromMessage(messageFromUser));
  // Show coin balance
  return `You have ${balance} Codey coins ${getCoinEmoji()}.`;
};

export const coinBalanceCommandDetails: CodeyCommandDetails = {
  name: 'balance',
  aliases: ['b', 'bal'],
  description: 'Get your coin balance.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}coin bal\`
  \`${container.botPrefix}coin balance\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting your coin balance...',
  executeCommand: coinBalanceExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,

  options: [],
  subcommandDetails: {}
};
