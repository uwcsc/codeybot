import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

const phraseSignupExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  return;
};

export const phraseSignupCommandDetails: CodeyCommandDetails = {
  name: 'signup',
  aliases: ['s'],
  description: 'Sign up to generate phrases of you!',
  detailedDescription: `**Examples:**
\`${container.botPrefix}phrase signup\`
\`${container.botPrefix}phrase s\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Signing user up...',
  executeCommand: phraseSignupExecuteCommand,
  options: [],
  subcommandDetails: {},
};
