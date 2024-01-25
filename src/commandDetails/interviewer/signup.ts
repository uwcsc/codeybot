import { CodeyUserError } from './../../codeyUserError';
import { container } from '@sapphire/framework';
import { Message } from 'discord.js';
import _ from 'lodash';
import { getEmojiByName } from '../../components/emojis';
import {
  parseLink,
  upsertInterviewer,
} from '../../components/interviewer';
import {
    CodeyCommandDetails,
    CodeyCommandOptionType,
    SapphireMessageExecuteType,
    SapphireMessageResponse,
} from '../../codeyCommand';

const signupExecuteCommand: SapphireMessageExecuteType = async (
    _client,
    messageFromUser,
    args,
): Promise<SapphireMessageResponse> => {
    const message = <Message>messageFromUser;
    const { id } = message.author;

    // Get calendar URL from the 1st capture group
    const calendarUrl = args[0];
    if (calendarUrl !== 'string') {
        console.log('Error');
    } 

    // Parse link and checks for validity
    const calendarUrlString = <string>calendarUrl
    const parsedUrl = parseLink(calendarUrlString);
    if (!parsedUrl) {
        throw new CodeyUserError(
            message,
            `I don't seem to recognize your meeting link. Be sure to use calendly or x.ai.`,
        );
    }

    // Add or update interviewer info
    await upsertInterviewer(id, parsedUrl);
    return message.reply(
        `Your info has been updated. Thanks for helping out! ${getEmojiByName('codey_love')?.toString()}`,
    );
};

export const signupCommandDetails: CodeyCommandDetails = {
    name: 'signup',
    aliases: [],
    description: 'Placeholder',
    detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer signup\``,

    isCommandResponseEphemeral: false,
    messageWhenExecutingCommand: 'Placeholder',
    executeCommand: signupExecuteCommand,
    messageIfFailure: 'Placeholder',
    options: [],
    subcommandDetails: {},
};