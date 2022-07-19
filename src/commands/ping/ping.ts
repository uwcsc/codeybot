import { Command, container } from '@sapphire/framework';
import { Message } from 'discord.js';
import {
  CodeyCommand,
  CodeyCommandDetails,
  CodeyCommandResponseType,
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
  _args,
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

const pingCommandDetails: CodeyCommandDetails = {
  name: 'ping',
  aliases: ['pong'],
  description: 'Ping the bot to see if it is alive.',
  detailedDescription: `**Examples:**
    \`${container.botPrefix}ping\`
    \`${container.botPrefix}pong\``,

  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Ping?',
  messageIfFailure: 'Failed to receive ping.',
  executeCommand: executeCommand,
  codeyCommandResponseType: CodeyCommandResponseType.STRING,

  options: [],
  subcommandDetails: {}
};

export class PingCommand extends CodeyCommand {
  details = pingCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: pingCommandDetails.aliases,
      description: pingCommandDetails.description,
      detailedDescription: pingCommandDetails.detailedDescription
    });
  }
}
