import { CodeyUserError } from './../../codeyUserError';
import { container } from '@sapphire/framework';
import { Message } from 'discord.js';
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
} from '../../codeyCommand';

const interviewerDomainExecuteCommand: SapphireMessageExecuteType = async (
    _client,
    messageFromUser,
    args,
): Promise<SapphireMessageResponse> => {
    const message = <Message>messageFromUser;
    const domain = args[0];
    if (domain !== 'string') {
        console.log('Error');
    } 
    else if (!(domain.toLowerCase() in availableDomains)) {
        throw new CodeyUserError(
            message,
            `You entered an invalid domain. Please enter one of ${getAvailableDomainsString()}.`,
        );
    }

    const domainString = <string>domain
    const { id } = message.author;
    // Check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
        throw new CodeyUserError(
            message,
            `You don't seem to have signed up yet. Please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`,
        );
    }

    // Add or remove domain to/from interviewer
    const inDomain = await toggleDomain(id, domainString);
    return message.reply(
        inDomain
        ? `You have been successfully removed from ${availableDomains[domainString]}`
        : `You have been successfully added to ${availableDomains[domainString]}`,
    );
};

export const interviewerDomainCommandDetails: CodeyCommandDetails = {
    name: 'domain',
    aliases: [],
    description: 'Placeholder',
    detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer domain\``,

    isCommandResponseEphemeral: false,
    messageWhenExecutingCommand: 'Placeholder',
    executeCommand: interviewerDomainExecuteCommand,
    messageIfFailure: 'Placeholder',
    options: [],
    subcommandDetails: {},
};