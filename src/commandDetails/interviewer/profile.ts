import { CodeyUserError } from './../../codeyUserError';
import { container } from '@sapphire/framework';
import { Message, EmbedBuilder } from 'discord.js';
import _ from 'lodash';
import {
  getDomains,
  getDomainsString,
  getInterviewer,
} from '../../components/interviewer';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';
import {
    CodeyCommandDetails,
    CodeyCommandOptionType,
    SapphireMessageExecuteType,
    SapphireMessageResponse,
} from '../../codeyCommand';

const interviewerProfileExecuteCommand: SapphireMessageExecuteType = async (
    _client,
    messageFromUser,
    _args,
): Promise<SapphireMessageResponse> => {
    const message = <Message>messageFromUser;
    const { id } = message.author;

    // Check if user signed up to be interviewer
    const interviewer = await getInterviewer(id);
    if (!interviewer) {
        throw new CodeyUserError(
            message,
            `You don't seem to have signed up yet. Please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`,
      );
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

    return message.channel.send({ embeds: [profileEmbed] });
};

export const interviewerProfileCommandDetails: CodeyCommandDetails = {
    name: 'profile',
    aliases: [],
    description: 'Placeholder',
    detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer profile\``,

    isCommandResponseEphemeral: false,
    messageWhenExecutingCommand: 'Placeholder',
    executeCommand: interviewerProfileExecuteCommand,
    messageIfFailure: 'Placeholder',
    options: [],
    subcommandDetails: {},
};