import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage
} from '../../codeyCommand';

import { resumeProfile, getInterviewer } from '../../components/interviewer';

const interviewerResumeExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  _args
): Promise<SapphireMessageResponse> => {
  const id = getUserFromMessage(messageFromUser).id;
  if (!(await getInterviewer(id))) {
    return `You don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`;
  }

  // resume interviewer data
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
  messageWhenExecutingCommand: 'Resuming',
  executeCommand: interviewerResumeExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,
  options: [],
  subcommandDetails: {}
};
