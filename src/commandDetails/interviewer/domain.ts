import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage
} from '../../codeyCommand';

import {
  availableDomains,
  getInterviewer,
  getAvailableDomainsString,
  toggleDomain
} from '../../components/interviewer';

const interviewerDomainExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args
): Promise<SapphireMessageResponse> => {
  const id = getUserFromMessage(messageFromUser).id;

  if (!(await getInterviewer(id))) {
    return `You don't seem to have signed up yet. Please sign up using the signup subcommand!`;
  }

  const domain = <string>args['domain'];

  if (!(domain.toLowerCase() in availableDomains))
    return `You entered an invalid domain. Please enter one of ${getAvailableDomainsString()}.`;

  const inDomain = await toggleDomain(id, domain);

  return inDomain
    ? `you have been successfully removed from ${availableDomains[domain]}`
    : `you have been successfully added to ${availableDomains[domain]}`;
};

export const interviewerDomainCommandDetails: CodeyCommandDetails = {
  name: 'domain',
  aliases: ['domain'],
  description: 'Modify domain data',
  detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer domain backend\``,
  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Modifying domain',
  executeCommand: interviewerDomainExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,
  options: [],
  subcommandDetails: {}
};
