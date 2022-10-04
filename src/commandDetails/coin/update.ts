import { container } from '@sapphire/framework';
import { Permissions, User } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
} from '../../codeyCommand';
import {
  getCoinBalanceByUserId,
  updateCoinBalanceByUserId,
  UserCoinEvent,
} from '../../components/coin';
import { getCoinEmoji } from '../../components/emojis';
import { pluralize } from '../../utils/pluralize';

// Update coin balance of a user
const coinUpdateExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  args,
) => {
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
  if (typeof amount !== 'number') {
    throw new Error('please enter a valid amount to adjust.');
  }

  // Optional argument is reason
  const reason = args['reason'];

  // Adjust coin balance
  await updateCoinBalanceByUserId(
    user.id,
    <number>amount,
    UserCoinEvent.AdminCoinAdjust,
    <string>(reason ? reason : ''),
    client.user?.id,
  );
  // Get new balance
  const newBalance = await getCoinBalanceByUserId(user.id);

  return `${user.username} now has ${newBalance} Codey ${pluralize(
    'coin',
    newBalance,
  )} ${getCoinEmoji()}.`;
};

export const coinUpdateCommandDetails: CodeyCommandDetails = {
  name: 'update',
  aliases: ['u'],
  description: 'Update the coin balance of a user.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}coin update @Codey 100\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Updating coin balance...',
  executeCommand: coinUpdateExecuteCommand,
  options: [
    {
      name: 'user',
      description: 'The user to update the balance of.',
      type: CodeyCommandOptionType.USER,
      required: true,
    },
    {
      name: 'amount',
      description: 'The amount to update the balance of the specified user to.',
      type: CodeyCommandOptionType.NUMBER,
      required: true,
    },
    {
      name: 'reason',
      description: 'The reason why we are updating the balance.',
      type: CodeyCommandOptionType.STRING,
      required: false,
    },
  ],
  subcommandDetails: {},
};
