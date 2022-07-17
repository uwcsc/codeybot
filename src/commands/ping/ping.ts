import { Command, container } from '@sapphire/framework';
import { Message } from 'discord.js';
import {
  CodeyCommand,
  SapphireMessageExecuteType,
  SapphireMessageRequest,
  SapphireMessageResponse
} from '../../codeyCommand';

const initialPingContent = 'Ping?';

const getApiLatency = (initialPing: SapphireMessageRequest, messageFromUserAsMessage: Message<boolean>) => {
  const initialPingAsMessage = <Message<boolean>>initialPing;
  return initialPingAsMessage.createdTimestamp - messageFromUserAsMessage.createdTimestamp;
};

const content = (botLatency: number, apiLatency: number) =>
  `Pong from JavaScript! Bot Latency ${botLatency}ms. API Latency ${apiLatency}ms.`;

const executeCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  initialMessageFromBot
): Promise<SapphireMessageResponse> => {
  // Assert message types are Message<boolean>
  // We have to do this because APIMessage does not have "createdTimestamp" property
  const messageFromUserAsMessage = <Message<boolean>>messageFromUser;
  const botLatency = client.ws.ping;
  if (initialMessageFromBot) {
    const apiLatency = getApiLatency(initialMessageFromBot, messageFromUserAsMessage);
    return new Promise((resolve, _reject) => resolve(content(botLatency, apiLatency)));
  }
  const initialPing = await messageFromUserAsMessage.channel.send(initialPingContent);
  const apiLatency = getApiLatency(initialPing, messageFromUserAsMessage);
  initialPing.edit(content(botLatency, apiLatency));
  return Promise.resolve('');
};

export class PingCommand extends CodeyCommand {
  messageWhenExecutingCommand = initialPingContent;
  messageIfFailure = 'Failed to receive ping.';
  executeCommand: SapphireMessageExecuteType = executeCommand;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: ['pong'],
      description: 'ping pong',
      detailedDescription: `**Examples:**
        \`${container.botPrefix}ping\`
        \`${container.botPrefix}pong\``
    });
  }
}
