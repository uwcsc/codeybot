import { container } from '@sapphire/framework';
import { User, MessageActionRow, MessageButton, ButtonInteraction } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  getUserFromMessage,
} from '../../codeyCommand';
import { getCoinBalanceByUserId, transferDbCoinsByUserIds } from '../../components/coin';
import { getCoinEmoji, getEmojiByName } from '../../components/emojis';

// Transfer coins to another user
const coinTransferExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
) => {
  // First mandatory argument is user
  const user = <User>args['user'];
  if (!user) {
    throw new Error('please enter a valid user mention or ID to transfer coins to.');
  }

  // Second mandatory argument is amount
  const amount = args['amount'];
  if (typeof amount !== 'number') {
    throw new Error('please enter a valid amount to transfer.');
  }

  // Get balance
  const senderBalance = await getCoinBalanceByUserId(getUserFromMessage(messageFromUser).id);
  const recipientBalance = await getCoinBalanceByUserId(user.id);

  // Implement some basic checks
  if (getUserFromMessage(messageFromUser).id === user.id) {
    return `You can't transfer coins to yourself ${getEmojiByName('codeyConfused')}.`;
  }
  if (senderBalance < amount) {
    return `You don't have enough coins to complete this transfer ${getEmojiByName(
      'codeyConfused',
    )}.`;
  }
  if (amount < 0) {
    return `You can't steal from people ${getEmojiByName('codeyAngry')}.`;
  }
  if (amount === 0) {
    return `What exactly are you trying to do there ${getEmojiByName('codeyStressed')}?`;
  }

  switch ((messageFromUser as unknown as ButtonInteraction).customId) {
    case 'accept':
      // Transfer coins
      await transferDbCoinsByUserIds(
        getUserFromMessage(messageFromUser).id,
        senderBalance,
        user.id,
        recipientBalance,
        amount,
      );

      // Get new balance
      const newRecipientBalance = await getCoinBalanceByUserId(user.id);
      const newSenderBalance = await getCoinBalanceByUserId(getUserFromMessage(messageFromUser).id);

      return `${
        user.username
      } now has ${newRecipientBalance} (and you have ${newSenderBalance}) Codey coins ${getCoinEmoji()} ${getEmojiByName(
        'codeyPoggers',
      )}.`;
    case 'reject':
      return 'The transfer has been canceled.';
    default:
  }

  return `Hey ${user}, ${getUserFromMessage(
    messageFromUser,
  )} wants to transfer ${amount} to you. What do you want to do?`;
};

export const coinTransferCommandDetails: CodeyCommandDetails = {
  name: 'transfer',
  aliases: ['t'],
  description: 'Transfer coins to another user.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}coin transfer @Codey 100\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Transferring coins...',
  executeCommand: coinTransferExecuteCommand,

  options: [
    {
      name: 'user',
      description: 'The user to transfer the amount to,',
      type: CodeyCommandOptionType.USER,
      required: true,
    },
    {
      name: 'amount',
      description: 'The amount to transfer,',
      type: CodeyCommandOptionType.NUMBER,
      required: true,
    },
  ],
  subcommandDetails: {},
  components: [
    new MessageActionRow().addComponents(
      new MessageButton().setCustomId('accept').setLabel('Accept').setStyle('SUCCESS'),
      new MessageButton().setCustomId('reject').setLabel('Reject').setStyle('DANGER'),
    ),
  ],
};
