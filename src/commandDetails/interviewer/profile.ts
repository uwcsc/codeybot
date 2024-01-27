import { container } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import _ from 'lodash';
import {
  getDomains,
  getDomainsString,
  getInterviewer,
} from '../../components/interviewer';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';
import {
    CodeyCommandDetails,
    SapphireMessageExecuteType,
    SapphireMessageResponse,
    getUserFromMessage,
} from '../../codeyCommand';

const interviewerProfileExecuteCommand: SapphireMessageExecuteType = async (
    _client,
    messageFromUser,
    _args,
): Promise<SapphireMessageResponse> => {
    const id = getUserFromMessage(messageFromUser).id;

    // Check if user signed up to be interviewer
    const interviewer = await getInterviewer(id);
    if (!interviewer) {
        return `You don't seem to have signed up yet. Please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`;
    }

    // Get domains
    const domains = await getDomains(id);

    // Build output embed
    const profileEmbed = new EmbedBuilder()
        .setColor(DEFAULT_EMBED_COLOUR)
        .setTitle('Interviewer Profile');
    profileEmbed.addFields([
        { name: '**Link**', value: interviewer.link },
        { name: '**Domains**', value: _.isEmpty(domains) ? 'None' : getDomainsString(domains) },
    ]);

    return { embeds: [profileEmbed] };
};

export const interviewerProfileCommandDetails: CodeyCommandDetails = {
    name: 'profile',
    aliases: ['pf'],
    description: 'Modify profile data',
    detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer profile\``,

    isCommandResponseEphemeral: false,
    messageWhenExecutingCommand: 'Modifying profile...',
    executeCommand: interviewerProfileExecuteCommand,
    messageIfFailure: 'Could not modify profile',
    options: [],
    subcommandDetails: {},
};