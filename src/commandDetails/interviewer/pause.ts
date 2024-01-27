import { CodeyUserError } from './../../codeyUserError';
import { container } from '@sapphire/framework';
import { Message } from 'discord.js';
import _ from 'lodash';
import { getInterviewer, pauseProfile } from '../../components/interviewer';
import {
    CodeyCommandDetails,
    CodeyCommandOptionType,
    SapphireMessageExecuteType,
    SapphireMessageResponse,
} from '../../codeyCommand';

const interviewerPauseExecuteCommand: SapphireMessageExecuteType = async (
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
            `You don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`,
        );
    }

    // Pause interviewer data
    await pauseProfile(id);
    return message.reply(
        `Your interviewer profile has been paused! You will not appear in interviewer queries anymore, until you run \`${container.botPrefix}interviewer resume\`.`,
    );
};

export const interviewerPauseCommandDetails: CodeyCommandDetails = {
    name: 'pause',
    aliases: [],
    description: 'Placeholder',
    detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer pause\``,

    isCommandResponseEphemeral: false,
    messageWhenExecutingCommand: 'Placeholder',
    executeCommand: interviewerPauseExecuteCommand,
    messageIfFailure: 'Placeholder',
    options: [],
    subcommandDetails: {},
};