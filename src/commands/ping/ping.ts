import { Command, container } from '@sapphire/framework';
import { Message } from 'discord.js';
import { CodeyCommand, CodeyCommandOptionType, SapphireMessageExecuteType, SapphireMessageResponse } from '../../codeyCommand';

const executeCommand: SapphireMessageExecuteType = (
  client,
  messageFromUser,
  initialMessageFromBot
): Promise<SapphireMessageResponse> => {
  // Assert message types are Message<boolean>
  // We have to do this because APIMessage does not have "createdTimestamp" property
  const messageFromUserAsMessage = <Message<boolean>>messageFromUser;
  const initialMessageFromBotAsMessage = <Message<boolean>>initialMessageFromBot;
  const botLatency = client.ws.ping;
  const apiLatency = initialMessageFromBotAsMessage.createdTimestamp - messageFromUserAsMessage.createdTimestamp;
  const content = `Pong from JavaScript! Bot Latency ${botLatency}ms. API Latency ${apiLatency}ms.`;
  return new Promise((resolve, _reject) => resolve(content));
};

export class PingCommand extends CodeyCommand {
  messageWhenExecutingCommand = 'Ping?';
  messageIfFailure = 'Failed to receive ping.';
  executeCommand: SapphireMessageExecuteType = executeCommand;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: ['pong'],
      description: 'Ping the bot to see if it is alive.',
      detailedDescription: `**Examples:**
        \`${container.botPrefix}ping\`
        \`${container.botPrefix}pong\``
    });
  }
}
