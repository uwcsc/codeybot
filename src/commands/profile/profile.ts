import { Command, container } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { profileAboutCommandDetails } from '../../commandDetails/profile/about';
import { profileGradCommandDetails } from '../../commandDetails/profile/grad';
import { profileSetCommandDetails } from '../../commandDetails/profile/set';

const profileCommandDetails: CodeyCommandDetails = {
  name: 'profile',
  aliases: ['userprofile', 'aboutme'],
  description: 'Handle user profile functions.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}profile @Codey\``,
  options: [],
  subcommandDetails: {
    about: profileAboutCommandDetails,
    grad: profileGradCommandDetails,
    set: profileSetCommandDetails,
  },
  defaultSubcommandDetails: profileAboutCommandDetails,
};

export class ProfileCommand extends CodeyCommand {
  details = profileCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: profileCommandDetails.aliases,
      description: profileCommandDetails.description,
      detailedDescription: profileCommandDetails.detailedDescription,
    });
  }
}
