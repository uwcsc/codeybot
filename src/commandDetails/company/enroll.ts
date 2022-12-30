import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { getCompanyInfo, insertCompany } from '../../components/company';

const companyEnrollExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const company_id = args['company_id'];
  if (!company_id) {
    throw new Error('please enter a valid company_id.');
  }
  const getExistingCompanyInfo = await getCompanyInfo(<string>company_id);
  if (getExistingCompanyInfo) {
    return 'Company already enrolled!.';
  }
  await insertCompany(<string>company_id);
  return 'Company succesfully enrolled!';
};

export const companyEnrollCommandDetails: CodeyCommandDetails = {
  name: 'enroll',
  aliases: ['e'],
  description: "Enroll a company into codey's database.",
  detailedDescription: `**Examples:**
    \`${container.botPrefix}company enroll https://www.crunchbase.com/organization/microsoft\`
    \`${container.botPrefix}company enroll microsoft\``,
  messageWhenExecutingCommand: 'Enrolling company...',
  executeCommand: companyEnrollExecuteCommand,

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
