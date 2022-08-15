import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage
} from '../../codeyCommand';

import { getInterviewer, pauseProfile } from '../../components/interviewer';

const interviewerPauseExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  _args
): Promise<SapphireMessageResponse> => {
  const id = getUserFromMessage(messageFromUser).id;
  //
  // check if user signed up to be interviewer
  if (!(await getInterviewer(id))) {
    return `You don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`;
  }

  // pause interviewer data
  await pauseProfile(id);
  return `Your interviewer profile has been paused! You will not appear in interviewer queries anymore, until you run \`${container.botPrefix}interviewer resume\`.`;
};

export const interviewerPauseCommandDetails: CodeyCommandDetails = {
  name: 'pause',
  aliases: ['pause'],
  description: 'Put a profile on pause',
  detailedDescription: `TODO`,
  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Pausing profile',
  executeCommand: interviewerPauseExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,
  options: [],
  subcommandDetails: {}
};
