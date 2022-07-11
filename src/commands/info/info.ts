import { Command, container } from '@sapphire/framework';
import { Message, MessageEmbed } from 'discord.js';
import { CodeyCommand, CodeyCommandResponseType, SapphireMessageExecuteType, SapphireMessageResponse } from '../../codeyCommand';

const INFO_EMBED_COLOR = '#4287f5';

/*
* Get info embed
* TODO: 
* - get app version and display it in the embed
* - get issue templates links
*/
export const getInfoEmbed = (): MessageEmbed => {
  const infoEmbed = new MessageEmbed()
    .setColor(INFO_EMBED_COLOR)
    .setTitle("Codey Information")
    .setURL("https://github.com/uwcsc/codeybot")
    .setDescription("Links to issue templates: <link>")
  console.log("hello");
  return infoEmbed;
}

const executeCommand: SapphireMessageExecuteType = (
  _client,
  _messageFromUser,
  _initialMessageFromBot
): SapphireMessageResponse => {
  const infoEmbed = getInfoEmbed();
  console.log("hello2");
  return infoEmbed;
};

export class InfoCommand extends CodeyCommand {
  messageWhenExecutingCommand = 'Fetching Codey info...';
  executeCommand: SapphireMessageExecuteType = executeCommand;
  isCommandResponseEphemeral = false;
  codeyCommandResponseType = CodeyCommandResponseType.EMBED;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      description: 'Fetches Codey information - app version, repository link and issue templates',
      detailedDescription: `**Examples:**
        \`${container.botPrefix}info\``
    });
  }
}
