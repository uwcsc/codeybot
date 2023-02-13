import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage,
} from '../../codeyCommand';
import { addUserToCompany, getCompanyInfo, insertCompany } from '../../components/company';

const companyAddExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const company_id = args['company_id'];
  if (!company_id) {
    throw new Error('please enter a valid crunchbase company id.');
  }
  const role = args['role'];
  if (!role) {
    throw new Error('please enter your role at this company.');
  }
  console.log(role);
  const company = await getCompanyInfo(<string>company_id);
  if (!company) {
    await insertCompany(<string>company_id);
  }
  const userId = getUserFromMessage(messageFromUser).id;
  await addUserToCompany(userId, <string>company_id, <string>role);
  return 'Successfully added company to profile!';
};

export const companyAddCommandDetails: CodeyCommandDetails = {
  name: 'add',
  aliases: ['a'],
  description: 'Add a company to your profile',
  detailedDescription: `**Examples:**
    \`${container.botPrefix}company add https://www.crunchbase.com/organization/microsoft\`
    \`${container.botPrefix}company a microsoft \``,
  messageWhenExecutingCommand: 'Adding...',
  executeCommand: companyAddExecuteCommand,

  options: [
    {
      name: 'company_id',
      description: `The unique identifier for the company. This can be either a link to its crunchbarse url or the company's crunchbase id,
        which is the last part of the crunchbase url (/organization/{crunchbase_id}).`,
      type: CodeyCommandOptionType.STRING,
      required: true,
    },
    {
      name: 'role',
      description: `Your role at the company. For example, "Software Engineering Intern" or "Data Science Intern".`,
      type: CodeyCommandOptionType.STRING,
      required: true,
    },
  ],
  subcommandDetails: {},
};
