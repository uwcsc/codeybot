import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  getUserFromMessage,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { checkIfUserSignedUp, signUpUserWithCollection } from '../../components/phrase';
import { logger } from '../../logger/default';
import { EmbedBuilder, Message } from 'discord.js';

const phraseSignupExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const title = 'Phrase Signup Information';
  const user = getUserFromMessage(messageFromUser);
  const userId = user.id;
  const username = user.username;
  const guildId = messageFromUser.guild?.id;

  // Check if guild ID is available
  if (!guildId) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle(title)
      .setDescription('This command can only be used in a server (guild).');
    return { embeds: [embed] };
  }

  try {
    // Check if user is already signed up
    const isAlreadySignedUp = await checkIfUserSignedUp(userId, guildId);
    if (isAlreadySignedUp) {
      const embed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle(title)
        .setDescription("You're already signed up for phrase generation!");
      return { embeds: [embed] };
    }

    // For long-running operations, send initial response first
    const initialResponse = await messageFromUser.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Blue')
          .setTitle(title)
          .setDescription(
            'Signing you up and collecting your messages... This may take a few minutes.',
          ),
      ],
      ephemeral: true,
      fetchReply: true,
    });

    // Sign up the user and collect messages
    const result = await signUpUserWithCollection(client, userId, guildId, username);

    let finalEmbed: EmbedBuilder;
    if (result.success) {
      finalEmbed = new EmbedBuilder().setColor('Green').setTitle(title);

      if (result.error) {
        finalEmbed.setDescription(`You're signed up! ${result.error}`);
      } else {
        finalEmbed.setDescription(
          `You've successfully signed up for phrase generation! Found ${
            result.messagesCollected || 0
          } messages to use for phrase generation.`,
        );
      }
    } else {
      finalEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle(title)
        .setDescription(result.error || 'Failed to sign up. Please try again later.');
    }

    // Update the response based on command type
    if (messageFromUser instanceof Message) {
      await initialResponse.edit({ embeds: [finalEmbed] });
    } else {
      await messageFromUser.editReply({ embeds: [finalEmbed] });
    }
  } catch (error) {
    logger.error('Error in phrase signup:', error);
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle(title)
      .setDescription('An error occurred while signing you up. Please try again later.');
    return { embeds: [embed] };
  }
};

export const phraseSignupCommandDetails: CodeyCommandDetails = {
  name: 'signup',
  aliases: ['s'],
  description: 'Sign up to generate phrases of you!',
  detailedDescription: `**Examples:**
\`${container.botPrefix}phrase signup\`
\`${container.botPrefix}phrase s\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Signing user up...',
  executeCommand: phraseSignupExecuteCommand,
  options: [],
  subcommandDetails: {},
};
