import { GuildMember } from 'discord.js';
import { CodeyUserError } from '../../codeyUserError';
import {
  configMaps,
  editUserProfile,
  UserProfile,
  validCustomizations,
  validCustomizationsDisplay,
  validUserCustomization,
} from '../../components/profile';
import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const profileSetExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const customization = <keyof typeof configMaps>args['customization'];
  // if no customization is supplied, or its not one of the customizations we provide, return
  if (!customization || !validCustomizations.includes(customization)) {
    throw new CodeyUserError(
      messageFromUser,
      `Please enter a customization. Must be one of**${validCustomizationsDisplay}**`,
    );
  }
  const description = <string>args['description'];
  if (!description) {
    throw new CodeyUserError(messageFromUser, 'Please enter a description.');
  }
  const { reason, parsedDescription } = validUserCustomization(customization, description);
  if (reason === 'valid' && messageFromUser.member) {
    editUserProfile(<GuildMember>messageFromUser.member, {
      [configMaps[customization]]: parsedDescription,
    } as UserProfile);
    return `${customization} has been set!`;
  }
  // if reason is not valid the reason will be returned by the validUserCustomization function
  const messagePrefix = 'Invalid arguments, please try again. Reason: ';
  throw new CodeyUserError(messageFromUser, messagePrefix + reason);
};

export const profileSetCommandDetails: CodeyCommandDetails = {
  name: 'set',
  aliases: ['s'],
  description: 'Set parameters of user profile.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}profile set @Codey\`
  \`${container.botPrefix}profile a @Codey\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: "Updating user's profile...",
  executeCommand: profileSetExecuteCommand,
  options: [
    {
      name: 'customization',
      description: 'The customization to be set for the user.',
      type: CodeyCommandOptionType.STRING,
      required: true,
    },
    {
      name: 'description',
      description: 'The description of the customization to be set for the user.',
      type: CodeyCommandOptionType.STRING,
      required: true,
    },
  ],
  subcommandDetails: {},
};
