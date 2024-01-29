import { container } from '@sapphire/framework';
import { clearProfile, getInterviewer } from '../../components/interviewer';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage,
} from '../../codeyCommand';

const interviewerClearExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const id = getUserFromMessage(messageFromUser).id;

  // Check if user signed up to be interviewer
  if (!(await getInterviewer(id))) {
    return `You don't seem to have signed up yet. Please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`;
  }

  // Clear interviewer data
  await clearProfile(id);
  return 'Your interviewer profile has been cleared!';
};

export const interviewerClearCommandDetails: CodeyCommandDetails = {
  name: 'clear',
  aliases: ['clr'],
  description: 'Clear all your interviewer data',
  detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer clear\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Clearing your interviewer profile...',
  executeCommand: interviewerClearExecuteCommand,
  messageIfFailure: 'Could not clear your interviewer profile',
  options: [],
  subcommandDetails: {},
};
