import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

const phraseCreateExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  return;
};

export const phraseCreateCommandDetails: CodeyCommandDetails = {
  name: 'create',
  aliases: ['c'],
  description: 'Generate phrases of you!',
  detailedDescription: `**Examples:**
\`${container.botPrefix}phrase create\`
\`${container.botPrefix}phrase c\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Creating phrase...',
  executeCommand: phraseCreateExecuteCommand,
  options: [],
  subcommandDetails: {},
};
