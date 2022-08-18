import { Command, container } from '@sapphire/framework';
import {
  CodeyCommand,
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';

const wikiLink = 'https://github.com/uwcsc/codeybot/wiki/Command-Help';

const executeCommand: SapphireMessageExecuteType = (
  _client,
  _messageFromUser,
  _args
): Promise<SapphireMessageResponse> => {
  return new Promise((resolve, _reject) => resolve(`<${wikiLink}>`));
};

const helpCommandDetails: CodeyCommandDetails = {
  name: 'help',
  aliases: ['wiki'],
  description: 'Provides the URL to the wiki page.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}help\`
\`${container.botPrefix}wiki\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Retrieving URL to the wiki page...',
  executeCommand: executeCommand,
  messageIfFailure: 'Could not retrieve URL to the wiki page.',
  options: [],
  subcommandDetails: {}
};

export class MiscellaneousHelpCommand extends CodeyCommand {
  details = helpCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: helpCommandDetails.aliases,
      description: helpCommandDetails.description,
      detailedDescription: helpCommandDetails.detailedDescription
    });
  }
}
