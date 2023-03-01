import { Command, container } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { companyEnrollCommandDetails } from '../../commandDetails/company/enroll';
import { companyAddCommandDetails } from '../../commandDetails/company/add';
import { companyFindCommandDetails } from '../../commandDetails/company/find';
import { companyProfileCommandDetails } from '../../commandDetails/company/profile';
import { companyRemoveCommandDetails } from '../../commandDetails/company/remove';

const companyCommandDetails: CodeyCommandDetails = {
  name: 'company',
  aliases: [],
  description:
    'Add yourself to a database of internships/jobs, or look for individuals that have worked at a job .',
  detailedDescription: `**Examples:**
\`${container.botPrefix}company add coinbase SRE\`
\`${container.botPrefix}company find coinbase\`
`,
  options: [],
  subcommandDetails: {
    enroll: companyEnrollCommandDetails,
    add: companyAddCommandDetails,
    remove: companyRemoveCommandDetails,
    find: companyFindCommandDetails,
    profile: companyProfileCommandDetails,
  },
  defaultSubcommandDetails: companyFindCommandDetails,
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
