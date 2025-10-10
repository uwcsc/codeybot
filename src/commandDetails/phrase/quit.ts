import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

const phraseQuitExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  return;
};

export const phraseQuitCommandDetails: CodeyCommandDetails = {
  name: 'quit',
  aliases: ['q'],
  description: 'Opt out of phrase generation',
  detailedDescription: `**Examples:**
\`${container.botPrefix}phrase quit\`
\`${container.botPrefix}phrase q\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Removing user from database...',
  executeCommand: phraseQuitExecuteCommand,
  options: [],
  subcommandDetails: {},
};
