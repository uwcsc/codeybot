import { CodeyUserError } from './../../codeyUserError';
import { container } from '@sapphire/framework';
import { ChatInputCommandInteraction, PermissionsBitField, User} from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import {
  updateCoinBalanceByUserId,
  getCoinBalanceByUserId,
  UserCoinEvent,
} from '../../components/coin';
import { getCoinEmoji } from '../../components/emojis'; 
import { pluralize } from '../../utils/pluralize';

// Divide everyone's coin counts by given divisor to promote more recent users
// Designed to be used at the end of a term
const coinPruneExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  if (
    !(<Readonly<PermissionsBitField>>messageFromUser.member?.permissions).has(
      PermissionsBitField.Flags.Administrator,
    )
  ) {
    throw new CodeyUserError(messageFromUser, `You do not have permission to use this command.`);
  }

  // First and only mandatory argument is divisor
  const divisor = <number>args['divisor']; // Cast divisor to a number to allow arithmetic operations
  if (!divisor || divisor < 1) {
    throw new CodeyUserError(messageFromUser, 'Please enter a valid number to divide by.');
  }

  // Optional argument is reason
  const reason = args['reason'];

  if (messageFromUser instanceof ChatInputCommandInteraction) {
    await (<ChatInputCommandInteraction>messageFromUser).deferReply();
  }
  // Prune coin balance of all users
  const allMembers = await messageFromUser.guild?.members.fetch();
  if (allMembers) {
    for (const member of allMembers.values()) {
      let currentBalance: number = await getCoinBalanceByUserId(member.user.id);
      await updateCoinBalanceByUserId(
        member.user.id,
        <number>Math.round(currentBalance / divisor),
        UserCoinEvent.AdminCoinPrune,
        <string>(reason ? reason : ''),
        client.user?.id,
      );
    }
  }
  // The message to be displayed after the command has been completed
  const returnMessage = `Divided all users' coin balances by ${divisor}.`;

  if (messageFromUser instanceof ChatInputCommandInteraction) {
    await(<ChatInputCommandInteraction>messageFromUser).editReply(
      returnMessage,
    );
  }
  else {
    await messageFromUser.channel?.send(returnMessage);
  }
  return;
};

export const coinPruneCommandDetails: CodeyCommandDetails = {
  name: 'prune',
  aliases: ['p'],
  description: 'Divide every users\' coin balance by the passed argument.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}coin prune @Codey 100\`
\`${container.botPrefix}coin prune @Codey -100 Codey broke.\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Pruning...',
  executeCommand: coinPruneExecuteCommand,
  options: [
    {
      name: 'divisor',
      description: 'The number to divide all users\' coin balances by.',
      type: CodeyCommandOptionType.NUMBER,
      required: true,
    },
    {
      name: 'reason',
      description: 'The reason why we are pruning the balances.',
      type: CodeyCommandOptionType.STRING,
      required: false,
    },
  ],
  subcommandDetails: {},
};
