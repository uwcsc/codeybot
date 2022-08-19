import { container } from '@sapphire/framework';
import { Permissions, User } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  CodeyCommandResponseType,
  SapphireMessageExecuteType
} from '../../codeyCommand';
import { getUserPrivacy, changeUserPrivacy } from '../../components/coin';

// Update coin leaderboard privacy of a user
const coinPrivacyExecuteCommand: SapphireMessageExecuteType = async (client, messageFromUser, args) => {
  if (!(<Readonly<Permissions>>messageFromUser.member?.permissions).has('ADMINISTRATOR')) {
    return `You do not have permission to use this command.`;
  }

  // First mandatory argument is user
  const user = <User>args['user'];
  if (!user) {
    throw new Error('please enter a valid user mention or ID for leaderboard privacy update.');
  }

  // Second mandatory argument is privacy
  const privacy = args['privacy'];
  if (typeof privacy !== 'number' || (privacy !== 0 && privacy !== 1)) {
    throw new Error('please enter 0/1 for public/private.');
  }

  // Adjust privacy
  await changeUserPrivacy(user.id, <number>privacy);

  // Get new privacy
  const newPrivacy = await getUserPrivacy(user.id);
  return `${user.username} is now ${newPrivacy ? 'private' : 'not private'}.`;
};

export const coinPrivacyCommandDetails: CodeyCommandDetails = {
  name: 'privacy',
  aliases: ['p'],
  description: 'Update the leaderboard privacy of a user.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}coin privacy @Codey 1\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Updating leaderboard privacy...',
  executeCommand: coinPrivacyExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,

  options: [
    {
      name: 'user',
      description: 'The user to adjust the privacy of,',
      type: CodeyCommandOptionType.USER,
      required: true
    },
    {
      name: 'privacy',
      description: 'The privacy to set the specified user to,',
      type: CodeyCommandOptionType.NUMBER,
      required: true
    }
  ],
  subcommandDetails: {}
};
