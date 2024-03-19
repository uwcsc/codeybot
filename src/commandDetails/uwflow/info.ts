import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

const uwflowInfoExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  _messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  return 'UWFlow is a website where students can view course reviews and ratings.';
};

export const uwflowInfoCommandDetails: CodeyCommandDetails = {
  name: 'info',
  aliases: ['information', 'i'],
  description: 'Get info about courses using UWFlow.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}uwflow info\`
\`${container.botPrefix}uwflow information\`
\`${container.botPrefix}uwflow i\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting information about UWFlow:',
  executeCommand: uwflowInfoExecuteCommand,
  options: [],
  subcommandDetails: {},
};
