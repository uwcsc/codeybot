import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  CodeyCommandOptionType,
  getUserFromMessage
} from '../../codeyCommand';

import { getEmojiByName } from '../../components/emojis';
import { parseLink, upsertInterviewer } from '../../components/interviewer';

const interviewerSignupExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args
): Promise<SapphireMessageResponse> => {
  const id = getUserFromMessage(messageFromUser).id;

  const calendarUrl = <string>args['calendar_url'];
  const parsedUrl = parseLink(calendarUrl);
  if (!parsedUrl) {
    return `I don't seem to recognize your meeting link. Be sure to use calendly or x.ai.`;
  }

  // Add or update interviewer info
  await upsertInterviewer(id, parsedUrl);
  return `Your info has been updated. Thanks for helping out! ${getEmojiByName('codeyLove')?.toString()}`;
};

export const interviewerSignupCommandDetails: CodeyCommandDetails = {
  name: 'signup',
  aliases: ['signup'],
  description: 'Sign users up to be interviewers',
  detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer signup www.calendly.com\``,
  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Signing up for a profile',
  executeCommand: interviewerSignupExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,
  options: [
    {
      name: 'calendar_url',
      description: 'A valid calendly.com or x.ai calendar link',
      type: CodeyCommandOptionType.STRING,
      required: true
    }
  ],
  subcommandDetails: {}
};
