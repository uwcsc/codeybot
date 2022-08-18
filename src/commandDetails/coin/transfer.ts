import { container } from '@sapphire/framework';
import { User, MessageActionRow, MessageButton } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  getUserFromMessage
} from '../../codeyCommand';
import {
  getCoinBalanceByUserId,
  changeDbCoinBalanceByUserId,
  UserCoinEvent,
  transferRecipientActionType
} from '../../components/coin';
import { getCoinEmoji, getEmojiByName } from '../../components/emojis';

// Transfer coins to another user
const coinTransferExecuteCommand: SapphireMessageExecuteType = async (client, messageFromUser, args) => {
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
  if (getUserFromMessage(messageFromUser).id === user.id) {
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

  messageFromUser.reply({
    content: 'hello',
    components: [
      new MessageActionRow().addComponents(
        new MessageButton().setCustomId('accept').setLabel('Accept').setStyle('SUCCESS'),
        new MessageButton().setCustomId('reject').setLabel('Reject').setStyle('DANGER')
      )
    ],
    allowedMentions: {
      users: [user.id],
      repliedUser: true
    }
  });

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
  const newSenderBalance = await getCoinBalanceByUserId(getUserFromMessage(messageFromUser).id);

  return `${
    user.username
  } now has ${newRecipientBalance} (and you have ${newSenderBalance}) Codey coins ${getCoinEmoji()} ${getEmojiByName(
    'codeyPoggers'
  )}.`;
};

export const coinTransferCommandDetails: CodeyCommandDetails = {
  name: 'transfer',
  aliases: ['t'],
  description: 'Transfer coins to another user.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}coin transfer @Codey 100 Gave me a cookie.\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Transferring coins...',
  executeCommand: coinTransferExecuteCommand,
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
      description: 'The reason why we are transferring money,',
      type: CodeyCommandOptionType.STRING,
      required: false
    }
  ],
  subcommandDetails: {}
};
