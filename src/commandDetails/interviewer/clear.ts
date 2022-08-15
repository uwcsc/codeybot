import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage
} from '../../codeyCommand';

import { clearProfile, getInterviewer } from '../../components/interviewer';

const interviewerClearExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  _args
): Promise<SapphireMessageResponse> => {
  const id = getUserFromMessage(messageFromUser).id;

  // check if user signed up to be interviewer
  if (!(await getInterviewer(id))) {
    return `You don't seem to have signed up yet. Please sign up using the signup subcommand!`;
  }

  // clear interviewer data
  await clearProfile(id);
  return 'Your interviewer profile has been cleared!';
};

export const interviewerClearCommandDetails: CodeyCommandDetails = {
  name: 'clear',
  aliases: ['clear'],
  description: 'clear interviewer data',
  detailedDescription: TODO,
  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Clearing profile',
  executeCommand: interviewerClearExecuteCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,
  options: [],
  subcommandDetails: {}
};
