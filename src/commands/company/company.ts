import { Command, container } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { companyEnrollCommandDetails } from '../../commandDetails/company/enroll';

const companyCommandDetails: CodeyCommandDetails = {
  name: 'company',
  aliases: [],
  description: 'View individuals at certain companies here.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}company \`
`,
  options: [],
  subcommandDetails: {
    enroll: companyEnrollCommandDetails,
  },
};

export class CompanyCommand extends CodeyCommand {
  details = companyCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: companyCommandDetails.aliases,
      description: companyCommandDetails.description,
      detailedDescription: companyCommandDetails.detailedDescription,
    });
  }
}
