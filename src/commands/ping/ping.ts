import { Command, container } from '@sapphire/framework';
import { Message } from 'discord.js';
import { CodeyCommand, CodeyCommandDetails, CodeyCommandResponseType, SapphireMessageExecuteType, SapphireMessageResponse } from '../../codeyCommand';

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
  subcommandDetails: {},
}

export class PingCommand extends CodeyCommand {
  details = pingCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: pingCommandDetails.aliases,
      description: pingCommandDetails.description,
      detailedDescription: pingCommandDetails.detailedDescription,
    });
  }
}
