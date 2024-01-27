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
    CodeyCommandOptionType,
    SapphireMessageExecuteType,
    SapphireMessageResponse,
    getUserFromMessage,
} from '../../codeyCommand';

const interviewerDomainExecuteCommand: SapphireMessageExecuteType = async (
    _client,
    messageFromUser,
    args,
): Promise<SapphireMessageResponse> => {
    const domain: string | undefined = <string>args['domain_name'];
    if (domain && !(domain.toLowerCase() in availableDomains)) {
        return `You entered an invalid domain. Please enter one of ${getAvailableDomainsString()}.`;
    }

    const id = getUserFromMessage(messageFromUser).id;
    // Check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
        return `You don't seem to have signed up yet. Please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`;
    }

    // Add or remove domain to/from interviewer
    const inDomain = await toggleDomain(id, domain);
    return inDomain
        ? `You have been successfully removed from ${availableDomains[domain]}`
        : `You have been successfully added to ${availableDomains[domain]}`;
};

export const interviewerDomainCommandDetails: CodeyCommandDetails = {
    name: 'domain',
    aliases: ['domain'],
    description: 'Modify domain data',
    detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer domain\``,

    isCommandResponseEphemeral: false,
    messageWhenExecutingCommand: 'Modifying domain data...',
    executeCommand: interviewerDomainExecuteCommand,
    messageIfFailure: 'Could not modify domain data',
    options: [
        {
            name: 'domain_name',
            description: 'A valid domain name',
            type: CodeyCommandOptionType.STRING,
            required: true
        }
    ],
    subcommandDetails: {},
};