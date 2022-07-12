import { Command, container } from '@sapphire/framework';
import { CodeyCommand, SapphireMessageExecuteType, SapphireMessageResponse } from '../../codeyCommand';

const wikiLink = 'https://github.com/uwcsc/codeybot/wiki/Command-Help:';

const commandOptions: Command.Options = {
  aliases: ['wiki'],
  description: 'Provides the URL to the wiki page.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}help\`
\`${container.botPrefix}wiki\``
};

const executeCommand: SapphireMessageExecuteType = (
  _client,
  _messageFromUser,
  _initialMessageFromBot
): SapphireMessageResponse => {
  return `<${wikiLink}>`;
};

export class MiscellaneousHelpCommand extends CodeyCommand {
  messageWhenExecutingCommand = 'Retrieving URL to the wiki page...';
  executeCommand: SapphireMessageExecuteType = executeCommand;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      ...commandOptions
    });
  }
}
