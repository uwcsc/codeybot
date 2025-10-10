import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  getUserFromMessage,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { EmbedBuilder, User } from 'discord.js';
import {
  checkIfUserSignedUp,
  getUserMessages,
  generateMarkovPhrase,
} from '../../components/phrase';
import { logger } from '../../logger/default';

const phraseCreateExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const caller = getUserFromMessage(messageFromUser);

  // Type-check the user argument properly
  let targetUser: User;
  if (args.user && args.user instanceof User) {
    targetUser = args.user;
  } else {
    targetUser = caller;
  }

  const guildId = messageFromUser.guild?.id;

  if (!guildId) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('Error ❌')
      .setDescription('This command can only be used in a server.');
    return { embeds: [embed] };
  }

  try {
    // Check if target user has opted in
    const isTargetSignedUp = await checkIfUserSignedUp(targetUser.id, guildId);
    if (!isTargetSignedUp) {
      const embed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle('User Not Signed Up')
        .setDescription(`${targetUser.username} hasn't opted in to phrase generation yet.`);
      return { embeds: [embed] };
    }

    // Get messages for the target user
    const messages = await getUserMessages(targetUser.id, guildId);
    if (messages.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle('No Messages Found')
        .setDescription(
          `No messages found for ${targetUser.username}. Try again after the next daily sync.`,
        );
      return { embeds: [embed] };
    }

    // Generate phrase using Markov chain
    const generatedPhrase = generateMarkovPhrase(messages);

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle(`${targetUser.username} says...`)
      .setDescription(`"${generatedPhrase}"`)
      .setFooter({ text: `Generated from ${messages.length} messages` });

    return { embeds: [embed] };
  } catch (error) {
    logger.error('Error generating phrase:', error);
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('Error ❌')
      .setDescription('An error occurred while generating the phrase. Please try again later.');
    return { embeds: [embed] };
  }
};

export const phraseCreateCommandDetails: CodeyCommandDetails = {
  name: 'create',
  aliases: ['c'],
  description: 'Generate phrases of you!',
  detailedDescription: `**Examples:**
\`${container.botPrefix}phrase create\`
\`${container.botPrefix}phrase c\`
\`${container.botPrefix}phrase create @username\`
\`${container.botPrefix}phrase c @username\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Creating phrase...',
  executeCommand: phraseCreateExecuteCommand,
  options: [
    {
      name: 'user',
      description: 'User to generate a phrase for (defaults to yourself)',
      type: CodeyCommandOptionType.USER,
      required: false,
    },
  ],
  subcommandDetails: {},
};
