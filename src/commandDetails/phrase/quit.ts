import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage,
} from '../../codeyCommand';
import { EmbedBuilder } from 'discord.js';
import { logger } from '../../logger/default';
import { checkIfUserSignedUp, removeUser } from '../../components/phrase';

const phraseQuitExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const title = 'Phrase Quit Information';
  const user = getUserFromMessage(messageFromUser);
  const userId = user.id;
  const guildId = messageFromUser.guild?.id;

  // Check if guild ID is available
  if (!guildId) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle(title)
      .setDescription('This command can only be used in a server.');
    return { embeds: [embed] };
  }

  try {
    // Check if user is signed up
    const isSignedUp = await checkIfUserSignedUp(userId, guildId);
    if (!isSignedUp) {
      const embed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle(title)
        .setDescription("You're not currently signed up for phrase generation.");
      return { embeds: [embed] };
    }

    // Remove the user
    await removeUser(userId, guildId);

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle(title)
      .setDescription(
        'You have been removed from phrase generation. All your message data has been removed from database.',
      );
    return { embeds: [embed] };
  } catch (error) {
    logger.error('Error in phrase quit:', error);
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle(title)
      .setDescription(
        'An error occurred while removing you from database. Please try again later.',
      );
    return { embeds: [embed] };
  }
};

export const phraseQuitCommandDetails: CodeyCommandDetails = {
  name: 'quit',
  aliases: ['q'],
  description: 'Opt out of phrase generation',
  detailedDescription: `**Examples:**
\`${container.botPrefix}phrase quit\`
\`${container.botPrefix}phrase q\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Removing user from database...',
  executeCommand: phraseQuitExecuteCommand,
  options: [],
  subcommandDetails: {},
};
