import { container } from '@sapphire/framework';
import { Permissions, User } from 'discord.js';
import {
  CodeyCommandOptionType,
  CodeyCommandDetails,
  SapphireMessageExecuteType,
} from '../../codeyCommand';

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
  const amount = args['amount'];
  if (typeof amount !== 'number') {
    throw new Error('please enter a valid amount to transfer.');
  }

  // Optional argument is reason
  const reason = args['reason'];

  return '';
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
