import { container } from '@sapphire/framework';
import _ from 'lodash';
import {
  availableDomains,
  getAvailableDomainsString,
  getInterviewer,
  toggleDomain
} from '../../components/interviewer';
import {
    CodeyCommandDetails,
    SapphireMessageExecuteType,
    SapphireMessageResponse,
    getUserFromMessage,
} from '../../codeyCommand';

const interviewerDomainExecuteCommand: SapphireMessageExecuteType = async (
    _client,
    messageFromUser,
    args,
): Promise<SapphireMessageResponse> => {
    const domain = args[0];
    if (domain !== 'string') {
        console.log('Error');
    } 
    else if (!(domain.toLowerCase() in availableDomains)) {
        return `You entered an invalid domain. Please enter one of ${getAvailableDomainsString()}.`;
    }

    const domainString = <string>domain
    const id = getUserFromMessage(messageFromUser).id;
    // Check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
        return `You don't seem to have signed up yet. Please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`;
    }

    // Add or remove domain to/from interviewer
    const inDomain = await toggleDomain(id, domainString);
    return inDomain
        ? `You have been successfully removed from ${availableDomains[domainString]}`
        : `You have been successfully added to ${availableDomains[domainString]}`;
};

export const interviewerDomainCommandDetails: CodeyCommandDetails = {
    name: 'domain',
    aliases: ['dom'],
    description: 'Modify domain data',
    detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer domain\``,

    isCommandResponseEphemeral: false,
    messageWhenExecutingCommand: 'Modifying domain data...',
    executeCommand: interviewerDomainExecuteCommand,
    messageIfFailure: 'Could not modify domain data',
    options: [],
    subcommandDetails: {},
};