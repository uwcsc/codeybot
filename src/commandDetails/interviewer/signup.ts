import { container } from '@sapphire/framework';
import { getEmojiByName } from '../../components/emojis';
import { parseLink, upsertInterviewer } from '../../components/interviewer';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage,
} from '../../codeyCommand';

const interviewerSignupExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const id = getUserFromMessage(messageFromUser).id;

  // Get calendar URL from the 1st capture group
  const calendarUrl = <string>args['calendar_url'];

  // Parse link and checks for validity
  const parsedUrl = parseLink(calendarUrl);
  if (!parsedUrl) {
    return `I don't seem to recognize your meeting link. Be sure to use calendly or x.ai.`;
  }

  // Add or update interviewer info
  await upsertInterviewer(id, parsedUrl);
  return `Your info has been updated. Thanks for helping out! ${getEmojiByName(
    'codey_love',
  )?.toString()}`;
};

export const interviewerSignupCommandDetails: CodeyCommandDetails = {
  name: 'signup',
  aliases: ['signup'],
  description: 'Sign yourself up to be an interviewer!',
  detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer signup www.calendly.com\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Signing up for a profile...',
  executeCommand: interviewerSignupExecuteCommand,
  messageIfFailure: 'Could not sign up for a profile',
  options: [
    {
      name: 'calendar_url',
      description: 'A valid calendly.com or x.ai calendar link',
      type: CodeyCommandOptionType.STRING,
      required: true,
    },
  ],
  subcommandDetails: {},
};
