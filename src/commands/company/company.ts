import { Command, container } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { companyEnrollCommandDetails } from '../../commandDetails/company/enroll';
import { companyAddCommandDetails } from '../../commandDetails/company/add';
import { companyFindCommandDetails } from '../../commandDetails/company/find';
import { companyProfileCommandDetails } from '../../commandDetails/company/profile';

const companyCommandDetails: CodeyCommandDetails = {
  name: 'company',
  aliases: [],
  description: 'View individuals at certain companies here.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}company add coinbase SRE\`
\`${container.botPrefix}company find coinbase\`
`,
  options: [],
  subcommandDetails: {
    enroll: companyEnrollCommandDetails,
    add: companyAddCommandDetails,
    find: companyFindCommandDetails,
    profile: companyProfileCommandDetails,
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
