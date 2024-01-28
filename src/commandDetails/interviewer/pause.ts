import { container } from '@sapphire/framework';
import { getInterviewer, pauseProfile } from '../../components/interviewer';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage,
} from '../../codeyCommand';

const interviewerPauseExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const id = getUserFromMessage(messageFromUser).id;

  // Check if user signed up to be interviewer
  if (!(await getInterviewer(id))) {
    return `You don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`;
  }

  // Pause interviewer data
  await pauseProfile(id);
  return `Your interviewer profile has been paused! You will not appear in interviewer queries anymore, until you run \`${container.botPrefix}interviewer resume\`.`;
};

export const interviewerPauseCommandDetails: CodeyCommandDetails = {
  name: 'pause',
  aliases: ['ps'],
  description: 'Put a profile on pause',
  detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer pause\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Pausing profile...',
  executeCommand: interviewerPauseExecuteCommand,
  messageIfFailure: 'Could not pause profile',
  options: [],
  subcommandDetails: {},
};
