import { CodeyUserError } from './../../codeyUserError';
import { container } from '@sapphire/framework';
import { Message } from 'discord.js';
import _ from 'lodash';
import { getInterviewer, resumeProfile } from '../../components/interviewer';
import {
    CodeyCommandDetails,
    CodeyCommandOptionType,
    SapphireMessageExecuteType,
    SapphireMessageResponse,
} from '../../codeyCommand';

const interviewerResumeExecuteCommand: SapphireMessageExecuteType = async (
    _client,
    messageFromUser,
    _args,
): Promise<SapphireMessageResponse> => {
    const message = <Message>messageFromUser;
    const { id } = message.author;

    // Check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
        throw new CodeyUserError(
            message,
            `You don't seem to have signed up yet. Please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`,
        );
    }

    // Resume interviewer data
    await resumeProfile(id);
    return message.reply('Your interviewer profile has been resumed!');
};

export const interviewerResumeCommandDetails: CodeyCommandDetails = {
    name: 'resume',
    aliases: [],
    description: 'Placeholder',
    detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer resume\``,

    isCommandResponseEphemeral: false,
    messageWhenExecutingCommand: 'Placeholder',
    executeCommand: interviewerResumeExecuteCommand,
    messageIfFailure: 'Placeholder',
    options: [],
    subcommandDetails: {},
};