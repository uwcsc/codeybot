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
  adjustCoinBalanceByUserId,
  getCoinBalanceByUserId,
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
    return new SapphireMessageResponseWithMetadata(
      `Please enter a valid user mention or ID for balance transfer.`,
      {},
    );
  }

  // Second mandatory argument is amount
  const amount = <number>args['amount'];
  if (typeof amount !== 'number' || !Number.isInteger(amount)) {
    return new SapphireMessageResponseWithMetadata(`Please enter a valid amount to transfer.`, {});
  }

  // Optional argument is reason
  const reason = args['reason'];

  // Retrieve sending user
  const sendingUser = getUserFromMessage(messageFromUser);

  // Ensure the transfer involves two distinct users
  if (sendingUser.id === receivingUser.id) {
    return new SapphireMessageResponseWithMetadata(`You can't transfer to yourself.`, {});
  }

  // Retrieve sending user balance and ensure transferred amount is valid
  const senderBalance = await getCoinBalanceByUserId(sendingUser.id);
  if (amount > senderBalance) {
    return new SapphireMessageResponseWithMetadata(
      `You don't have enough ${getCoinEmoji()} to transfer that amount.`,
      {},
    );
  } else if (amount <= 0) {
    return new SapphireMessageResponseWithMetadata(`You can't transfer less than 1 coin.`, {});
  }

  // Adjust the receiver balance with coins transferred
  await adjustCoinBalanceByUserId(
    receivingUser.id,
    amount,
    UserCoinEvent.AdminCoinAdjust,
    <string>(reason ?? ''),
    client.user?.id,
  );

  // Get new receiver balance
  const newReceiverBalance = await getCoinBalanceByUserId(receivingUser.id);

  // Adjust the sender balance with coins transferred
  await adjustCoinBalanceByUserId(
    sendingUser.id,
    <number>(-1 * amount),
    UserCoinEvent.AdminCoinAdjust,
    <string>(reason ?? ''),
    client.user?.id,
  );

  // Get new sender balance
  const newSenderBalance = await getCoinBalanceByUserId(sendingUser.id);

  return `${receivingUser.username} now has ${newReceiverBalance} Codey ${pluralize(
    'coin',
    newReceiverBalance,
  )} ${getCoinEmoji()}. ${sendingUser.username} now has ${newSenderBalance} Codey ${pluralize(
    'coin',
    newReceiverBalance,
  )} ${getCoinEmoji()}.`;
};

export const coinTransferCommandDetails: CodeyCommandDetails = {
  name: 'transfer',
  aliases: ['t'],
  description: 'Transfer coins from your balance to another user.',
  detailedDescription: `**Examples:**
	\`${container.botPrefix}coin transfer @Codey 10\`
  \`${container.botPrefix}coin transfer @Codey 10 Lost a bet to Codey\``,

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
