import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { getEmployeesByCompanyId } from '../../components/company';

const CRUNCHBASE_IMAGE_CDN =
  'https://res.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_1';
const companyFindExecuteCommand: SapphireMessageExecuteType = async (
  client,
  _messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const company_id = args['company_id'];
  if (!company_id) {
    throw new Error('please enter a valid user mention or ID for balance adjustment.');
  }
  const companyUsers = await getEmployeesByCompanyId(<string>company_id);
  if (!companyUsers) {
    return 'No one works at this company in the server!';
  }
  const formattedUsers = await Promise.all(
    companyUsers.map(async (user) => {
      return {
        ...user,
        tag: (await client.users.fetch(user.user_id)).tag,
      };
    }),
  );
  return `employees are: ${JSON.stringify(formattedUsers)}`;
};

export const companyFindCommandDetails: CodeyCommandDetails = {
  name: 'find',
  aliases: ['f'],
  description: 'Find all individuals that work at the company.',
  detailedDescription: `**Examples:**
    \`${container.botPrefix}company find https://www.crunchbase.com/organization/microsoft\`
    \`${container.botPrefix}company f microsoft\``,
  messageWhenExecutingCommand: 'Enrolling company...',
  executeCommand: companyFindExecuteCommand,

  options: [
    {
      name: 'company_id',
      description: `The unique identifier for the company. This can be either a link to its crunchbarse url or the company's crunchbase id,
        which is the last part of the crunchbase url (/organization/{crunchbase_id}).`,
      type: CodeyCommandOptionType.STRING,
      required: true,
    },
  ],
  subcommandDetails: {},
};
