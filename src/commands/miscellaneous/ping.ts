import { Command, container } from '@sapphire/framework';
import {
  CodeyCommand,
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

const content = (botLatency: number, apiLatency: number) =>
  `Pong from JavaScript! Bot Latency ${botLatency}ms. API Latency ${apiLatency}ms.`;

const executeCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const botLatency = client.ws.ping;
  const apiLatency = Date.now() - messageFromUser.createdTimestamp;
  return `${content(botLatency, apiLatency)}`;
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
  options: [],
  subcommandDetails: {},
};

export class MiscellaneousPingCommand extends CodeyCommand {
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
