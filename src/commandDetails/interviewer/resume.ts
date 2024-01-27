import { container } from '@sapphire/framework';
import _ from 'lodash';
import { getInterviewer, resumeProfile } from '../../components/interviewer';
import {
    CodeyCommandDetails,
    SapphireMessageExecuteType,
    SapphireMessageResponse,
    getUserFromMessage,
} from '../../codeyCommand';

const interviewerResumeExecuteCommand: SapphireMessageExecuteType = async (
    _client,
    messageFromUser,
    _args,
): Promise<SapphireMessageResponse> => {
    const id = getUserFromMessage(messageFromUser).id;

    // Check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
        `You don't seem to have signed up yet. Please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`;
    }

    // Resume interviewer data
    await resumeProfile(id);
    return 'Your interviewer profile has been resumed!';
};

export const interviewerResumeCommandDetails: CodeyCommandDetails = {
    name: 'resume',
    aliases: ['resume'],
    description: 'Resume an interviewer profile',
    detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer resume\``,

    isCommandResponseEphemeral: false,
    messageWhenExecutingCommand: 'Resuming profile...',
    executeCommand: interviewerResumeExecuteCommand,
    messageIfFailure: 'Could not resume profile',
    options: [],
    subcommandDetails: {},
};