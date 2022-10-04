import { container } from '@sapphire/framework';
import { Permissions, User } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import {
  adjustCoinBalanceByUserId,
  getCoinBalanceByUserId,
  UserCoinEvent,
} from '../../components/coin';
import { getCoinEmoji } from '../../components/emojis';
import { pluralize } from '../../utils/pluralize';

// Adjust coin balance
const coinAdjustExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  if (!(<Readonly<Permissions>>messageFromUser.member?.permissions).has('ADMINISTRATOR')) {
    return `You do not have permission to use this command.`;
  }

  // First mandatory argument is user
  const user = <User>args['user'];
  if (!user) {
    throw new Error('please enter a valid user mention or ID for balance adjustment.');
  }

  // Second mandatory argument is amount
  const amount = args['amount'];
  if (!amount) {
    throw new Error('please enter a valid amount to adjust.');
  }

  // Optional argument is reason
  const reason = args['reason'];

  // Adjust coin balance
  await adjustCoinBalanceByUserId(
    user.id,
    <number>amount,
    UserCoinEvent.AdminCoinAdjust,
    <string>(reason ? reason : ''),
    client.user?.id,
  );
  // Get new balance
  const newBalance = await getCoinBalanceByUserId(user.id);

  const COIN = getCoinEmoji();
  return `Adjusted ${user.username}'s balance by ${amount} ${COIN}.\n
  ${user.username} now has ${newBalance} Codey ${pluralize('coin', newBalance)} ${COIN}.`;
};

export const coinAdjustCommandDetails: CodeyCommandDetails = {
  name: 'adjust',
  aliases: ['a'],
  description: 'Adjust the coin balance of a user.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}coin adjust @Codey 100\`
\`${container.botPrefix}coin adjust @Codey -100 Codey broke.\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Adjusting coin balance...',
  executeCommand: coinAdjustExecuteCommand,
  options: [
    {
      name: 'user',
      description: 'The user to adjust the balance of.',
      type: CodeyCommandOptionType.USER,
      required: true,
    },
    {
      name: 'amount',
      description: 'The amount to adjust the balance of the specified user by.',
      type: CodeyCommandOptionType.NUMBER,
      required: true,
    },
    {
      name: 'reason',
      description: 'The reason why we are adjusting the balance.',
      type: CodeyCommandOptionType.STRING,
      required: false,
    },
  ],
  subcommandDetails: {},
};
