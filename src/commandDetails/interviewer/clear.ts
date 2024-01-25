import { CodeyUserError } from './../../codeyUserError';
import { container } from '@sapphire/framework';
import { Message } from 'discord.js';
import _ from 'lodash';
import { clearProfile, getInterviewer } from '../../components/interviewer';
import {
    CodeyCommandDetails,
    CodeyCommandOptionType,
    SapphireMessageExecuteType,
    SapphireMessageResponse,
} from '../../codeyCommand';

const clearExecuteCommand: SapphireMessageExecuteType = async (
    _client,
    messageFromUser,
    _args,
): Promise<SapphireMessageResponse> => {
    try {
        const message = <Message>messageFromUser;
        const { id } = message.author;     

        // check if user signed up to be interviewer
        if (!(await getInterviewer(id))) {
            throw new CodeyUserError(
                message,
                `You don't seem to have signed up yet. Please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`,
            );
        }
        
        // clear interviewer data
        await clearProfile(id);
        return message.reply('your interviewer profile has been cleared!');
    } catch (e) {
        if (e instanceof CodeyUserError) {
            e.sendToUser();
        }
    }
};

export const clearCommandDetails: CodeyCommandDetails = {
    name: 'clear',
    aliases: ['cls'],
    description: 'Placeholder',
    detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer clear\``,

    isCommandResponseEphemeral: false,
    messageWhenExecutingCommand: 'Placeholder',
    executeCommand: clearExecuteCommand,
    messageIfFailure: 'Placeholder',
    options: [],
    subcommandDetails: {},
};