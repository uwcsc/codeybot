import { SapphireClient, container } from '@sapphire/framework';
import { EmbedBuilder, Message, User, userMention } from 'discord.js';
import {
  CodeyCommandOptionType,
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  getUserFromMessage,
  SapphireMessageResponseWithMetadata,
  SapphireAfterReplyType,
} from '../../codeyCommand';
import { getCoinBalanceByUserId, transferTracker } from '../../components/coin';
import { getCoinEmoji } from '../../components/emojis';

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
  const reason = <string>args['reason'] ?? '';
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
  } else if (amount < 1) {
    return new SapphireMessageResponseWithMetadata(`You can't transfer less than 1 coin.`, {});
  }

  const transfer = await transferTracker.startTransfer(
    sendingUser,
    receivingUser,
    amount,
    reason,
    client,
    messageFromUser.channelId,
  );

  return new SapphireMessageResponseWithMetadata(await transfer.getTransferResponse(), {
    transferId: transfer.transferId,
    _client: client,
    receiver: receivingUser,
  });
};

const transferAfterMessageReply: SapphireAfterReplyType = async (result, sentMessage) => {
  if (typeof result.metadata.transferId === 'undefined') return;

  // Send a dm to the transfer receiver
  const receivingUser = <User>result.metadata['receiver'];
  const client = <SapphireClient>result.metadata['_client'];

  const mentionUser = userMention(receivingUser.id);

  // do not attempt sending dms to discord bots
  if (!receivingUser.bot) {
    const message = <Message>sentMessage;
    const messageLink = message.url;
    const transferPingMessage = `Hey ${mentionUser}, you've received a CodeyCoin transfer! 

Check it out here: ${messageLink}`;

    const transferPingEmbed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('New CodeyCoin Transfer!')
      .setDescription(transferPingMessage);
    client.users.send(receivingUser, { embeds: [transferPingEmbed] });
  }

  transferTracker.runFuncOnTransfer(<string>result.metadata.transferId, (transfer) => {
    transfer.transferMessage = sentMessage;
  });
};

export const coinTransferCommandDetails: CodeyCommandDetails = {
  name: 'transfer',
  aliases: ['t'],
  description: 'Transfer coins from your balance to another user.',
  detailedDescription: `**Examples:**
	\`${container.botPrefix}coin transfer @Codey 10\`
  \`${container.botPrefix}coin transfer @Codey 10 Lost a bet to @Codey\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Setting up the transaction...',
  afterMessageReply: transferAfterMessageReply,
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
