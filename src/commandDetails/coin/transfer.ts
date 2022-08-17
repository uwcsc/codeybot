import { container } from '@sapphire/framework';
import { User } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  getUserFromMessage
} from '../../codeyCommand';
import { getCoinBalanceByUserId, changeDbCoinBalanceByUserId, UserCoinEvent } from '../../components/coin';
import { getCoinEmoji, getEmojiByName } from '../../components/emojis';

// Update coin balance of a user
const coinUpdateExecuteCommand: SapphireMessageExecuteType = async (client, messageFromUser, args) => {
  // First mandatory argument is user
  const user = <User>args['user'];
  if (!user) {
    throw new Error('please enter a valid user mention or ID to transfer coins.');
  }

  // Second mandatory argument is amount
  const amount = args['amount'];
  if (typeof amount !== 'number') {
    throw new Error('please enter a valid amount to transfer.');
  }

  // Optional argument is reason
  const reason = args['reason'] ?? null;

  // Get balance
  const senderBalance = await getCoinBalanceByUserId(getUserFromMessage(messageFromUser).id);
  const recipientBalance = await getCoinBalanceByUserId(user.id);

  // Implement some basic checks
  if (messageFromUser.member!.user.id === user.id) {
    return `You can't transfer money to yourself ${getEmojiByName('codeyConfused')}.`;
  }
  if (senderBalance < amount) {
    return `You don't have enough coins to complete this transfer ${getEmojiByName('codeyConfused')}.`;
  }
  if (amount < 0) {
    return `You can't steal from people ${getEmojiByName('codeyAngry')}.`;
  }
  if (amount === 0) {
    return `What exactly are you trying to do there ${getEmojiByName('codeyStressed')}?`;
  }

  // Transfer coins
  await changeDbCoinBalanceByUserId(
    getUserFromMessage(messageFromUser).id,
    senderBalance,
    senderBalance - amount,
    UserCoinEvent.CoinTransferSender,
    <string | null>reason
  );
  await changeDbCoinBalanceByUserId(
    user.id,
    recipientBalance,
    recipientBalance + amount,
    UserCoinEvent.CoinTransferRecipient,
    <string | null>reason
  );

  // Get new balance
  const newRecipientBalance = await getCoinBalanceByUserId(user.id);

  return `${user.username} now has ${newRecipientBalance} Codey coins ${getCoinEmoji()} ${getEmojiByName(
    'codeyPoggers'
  )}.`;
};

export const coinTransferCommandDetails: CodeyCommandDetails = {
  name: 'transfer',
  aliases: ['t'],
  description: 'Transfer money to another user.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}coin transfer @Codey 100 Gave me a cookie.\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Transfering coins...',
  executeCommand: coinUpdateExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,

  options: [
    {
      name: 'user',
      description: 'The user to transfer the amount to,',
      type: CodeyCommandOptionType.USER,
      required: true
    },
    {
      name: 'amount',
      description: 'The amount to transfer,',
      type: CodeyCommandOptionType.NUMBER,
      required: true
    },
    {
      name: 'reason',
      description: 'The reason why we are transfering money,',
      type: CodeyCommandOptionType.STRING,
      required: false
    }
  ],
  subcommandDetails: {}
};
