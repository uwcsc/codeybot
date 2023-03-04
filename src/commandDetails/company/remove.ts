import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage,
} from '../../codeyCommand';
import { getCompanyInfo, removeUserFromCompany } from '../../components/company';

const companyRemoveExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const company_id = args['company_id'];
  if (!company_id) {
    throw new Error('please enter a valid crunchbase company id.');
  }
  const company = await getCompanyInfo(<string>company_id);
  const user_id = getUserFromMessage(messageFromUser).id;
  removeUserFromCompany(user_id, <string>company_id);
  return `Successfully removed company ${company.name} from profile!`;
};

export const companyRemoveCommandDetails: CodeyCommandDetails = {
  name: 'remove',
  aliases: ['r'],
  description: 'Remove a company to your profile',
  detailedDescription: `**Examples:**
    \`${container.botPrefix}company remove https://www.crunchbase.com/organization/microsoft\`
    \`${container.botPrefix}company r microsoft \``,
  messageWhenExecutingCommand: 'Removing...',
  executeCommand: companyRemoveExecuteCommand,

  options: [
    {
      name: 'company_id',
      description: `The id for the company. This can be either a link to its crunchbase url or the crunchbase id.`,
      type: CodeyCommandOptionType.STRING,
      required: true,
    },
  ],
  subcommandDetails: {},
};
