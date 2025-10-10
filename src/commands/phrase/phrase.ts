import { Command, container } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { phraseSignupCommandDetails } from '../../commandDetails/phrase/signup';
import { phraseCreateCommandDetails } from '../../commandDetails/phrase/create';
import { phraseQuitCommandDetails } from '../../commandDetails/phrase/quit';

const phraseCommandDetails: CodeyCommandDetails = {
  name: 'phrase',
  aliases: [],
  description: 'Handle phrase functions.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}phrase signup\`
\`${container.botPrefix}phrase s\
\`${container.botPrefix}phrase create\`
\`${container.botPrefix}phrase c\
\`${container.botPrefix}phrase create @Codey\`
\`${container.botPrefix}phrase c @Codey\
\`${container.botPrefix}phrase quit\
\`${container.botPrefix}phrase q\``,
  options: [],
  subcommandDetails: {
    signup: phraseSignupCommandDetails,
    create: phraseCreateCommandDetails,
    quit: phraseQuitCommandDetails,
  },
  defaultSubcommandDetails: phraseCreateCommandDetails,
};

export class PhraseCommand extends CodeyCommand {
  details = phraseCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: phraseCommandDetails.aliases,
      description: phraseCommandDetails.description,
      detailedDescription: phraseCommandDetails.detailedDescription,
    });
  }
}
