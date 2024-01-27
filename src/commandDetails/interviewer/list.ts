import { CodeyUserError } from './../../codeyUserError';
import { container } from '@sapphire/framework';
import { Message, EmbedBuilder } from 'discord.js';
import _ from 'lodash';
import {
  availableDomains,
  getAvailableDomainsString,
  getInterviewerDomainsString,
  getInterviewers,
  Interviewer
} from '../../components/interviewer';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';
import {
    CodeyCommandDetails,
    CodeyCommandOptionType,
    SapphireMessageExecuteType,
    SapphireMessageResponse,
} from '../../codeyCommand';

const RESULTS_PER_PAGE = 6;

const getInterviewerDisplayInfo = async(interviewer: Interviewer): Promise<string> => {
    const { client } = container;
    const user = await client.users.fetch(interviewer['user_id']);
    const userDomainsAddIn = await getInterviewerDomainsString(interviewer['user_id']);
    if (userDomainsAddIn === '') {
        return `${user} | [Calendar](${interviewer['link']})\n\n`;
    } else {
        return `${user} | [Calendar](${interviewer['link']}) | ${userDomainsAddIn}\n\n`;
    }
}

const interviewerListExecuteCommand: SapphireMessageExecuteType = async (
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
    // Query interviewers
    const interviewers = await getInterviewers(domainString);
    // Shuffles interviewers to load balance
    const shuffledInterviewers = _.shuffle(interviewers);
    // Only show up to page limit
    const interviewersToShow = shuffledInterviewers.slice(0, RESULTS_PER_PAGE);
    // Get information from each interviewer
    const interviewersInfo = await Promise.all(
        interviewersToShow.map((interviewer) => getInterviewerDisplayInfo(interviewer)),
    );

    // Construct embed for display
    const title = domain
        ? `Available Interviewers for ${availableDomains[domainString]}`
        : 'Available Interviewers';
    const outEmbed = new EmbedBuilder().setColor(DEFAULT_EMBED_COLOUR).setTitle(title);
    outEmbed.setDescription(interviewersInfo.join());
    return message.channel.send({ embeds: [outEmbed] });
};

export const interviewerListCommandDetails: CodeyCommandDetails = {
    name: 'list',
    aliases: [],
    description: 'Placeholder',
    detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer list\``,

    isCommandResponseEphemeral: false,
    messageWhenExecutingCommand: 'Placeholder',
    executeCommand: interviewerListExecuteCommand,
    messageIfFailure: 'Placeholder',
    options: [],
    subcommandDetails: {},
};