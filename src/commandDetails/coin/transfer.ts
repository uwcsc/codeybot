import { container } from '@sapphire/framework';
import { User } from 'discord.js';
import {
  CodeyCommandOptionType,
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  getUserFromMessage,
  SapphireMessageResponseWithMetadata,
} from '../../codeyCommand';
import {
  getCoinBalanceByUserId,
  updateCoinBalanceByUserId,
  UserCoinEvent,
} from '../../components/coin';
import { getCoinEmoji } from '../../components/emojis';
import { pluralize } from '../../utils/pluralize';

const coinTransferExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  args,
) => {
  // First mandatory argument is receiving user
  const receivingUser = <User>args['user'];
  if (!receivingUser) {
    throw new Error('please enter a valid user mention or ID for balance transfer.');
  }

  // Second mandatory argument is amount
  const amount = <number>args['amount'];
  if (typeof amount !== 'number') {
    throw new Error('please enter a valid amount to transfer.');
  }

  // Optional argument is reason
  const reason = args['reason'];

  // Retrieve the sender balance and ensure they have enough coins
  const senderBalance = await getCoinBalanceByUserId(getUserFromMessage(messageFromUser).id);
  if (amount > senderBalance) {
    return new SapphireMessageResponseWithMetadata(
      `You don't have enough ${getCoinEmoji()} to place that bet.`,
      {},
    );
  }

  // Retrieve the receiver balance, add the coins transferred and update
  const receiverBalance = await getCoinBalanceByUserId(receivingUser.id);
  await updateCoinBalanceByUserId(
    receivingUser.id,
    <number>(receiverBalance + amount),
    UserCoinEvent.AdminCoinUpdate,
    <string>(reason ?? ''),
    client.user?.id,
  );

  // Get new balance
  const newBalance = await getCoinBalanceByUserId(receivingUser.id);

  return `${receivingUser.username} now has ${newBalance} Codey ${pluralize(
    'coin',
    newBalance,
  )} ${getCoinEmoji()}.`;
};

export const coinTransferCommandDetails: CodeyCommandDetails = {
  name: 'transfer',
  aliases: ['t'],
  description: 'Transfer coins from your balance to another user.',
  detailedDescription: `**Examples:**
	\`${container.botPrefix}coin transfer @Codey 10\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Transferring coins...',
  executeCommand: coinTransferExecuteCommand,
  options: [
    {
      name: 'user',
      description: 'The user to transfer coins to.',
      type: CodeyCommandOptionType.USER,
      required: true,
    },
    {
      name: 'amount',
      description: 'The amount to transfer to the specified user.',
      type: CodeyCommandOptionType.NUMBER,
      required: true,
    },
    {
      name: 'reason',
      description: 'The reason for transferring.',
      type: CodeyCommandOptionType.STRING,
      required: false,
    },
  ],
  subcommandDetails: {},
};
