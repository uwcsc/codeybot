import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage,
} from '../../codeyCommand';
import { getCompaniesByUserId } from '../../components/company';

const companyProfileExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
): Promise<SapphireMessageResponse> => {
  const user = getUserFromMessage(messageFromUser);
  const companies = await getCompaniesByUserId(user.id);
  return `your companies are: ${JSON.stringify(companies)}`;
};

export const companyProfileCommandDetails: CodeyCommandDetails = {
  name: 'profile',
  aliases: ['p'],
  description: 'List all the companies you are associated with',
  detailedDescription: `**Examples:**
    \`${container.botPrefix}company profile\`
    \`${container.botPrefix}company p\``,
  messageWhenExecutingCommand: 'Finding...',
  executeCommand: companyProfileExecuteCommand,
  options: [],
  subcommandDetails: {},
};
