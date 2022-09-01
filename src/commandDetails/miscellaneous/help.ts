import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

const wikiLink = 'https://github.com/uwcsc/codeybot/wiki/Command-Help';

const helpExecuteCommand: SapphireMessageExecuteType = (
  _client,
  _messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  return new Promise((resolve, _reject) => resolve(`<${wikiLink}>`));
};

export const helpCommandDetails: CodeyCommandDetails = {
  name: 'help',
  aliases: ['wiki'],
  description: 'Get the URL to the wiki page.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}help\`
\`${container.botPrefix}wiki\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Retrieving URL to the wiki page...',
  executeCommand: helpExecuteCommand,
  messageIfFailure: 'Could not retrieve URL to the wiki page.',
  options: [],
  subcommandDetails: {},
};
