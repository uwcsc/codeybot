import { Command, container } from '@sapphire/framework';
import { Message } from 'discord.js';
import {
  CodeyCommand,
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

const executePingCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const botLatency = client.ws.ping;

  // we can freely coerce to a Message because the alternative type: APIMessage
  // is only received:
  // "when you receive an interaction from a guild that the client is not in."
  // src: https://github.com/discordjs/discord.js/issues/7001#issuecomment-972422214
  const initialResponse = <Message<boolean>>await messageFromUser.reply({
    content: 'Pong?',
    ephemeral: pingCommandDetails.isCommandResponseEphemeral,
    fetchReply: true,
  });

  const initialResponseTimestamp = initialResponse.createdTimestamp;
  const apiLatency = initialResponseTimestamp - messageFromUser.createdTimestamp;
  const stringReply = content(botLatency, apiLatency);

  // have to modify the original interaction when using slash commands
  // because you cannot edit ephemeral responses.
  // fails at runtime, no type warning
  if (messageFromUser instanceof Message) {
    await initialResponse.edit(stringReply);
  } else {
    await messageFromUser.editReply(stringReply);
  }
};

function content(botLatency: number, apiLatency: number): string {
  return `Pong from JavaScript! Bot Latency ${botLatency}ms. API Latency ${apiLatency}ms.`;
}

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
  executeCommand: executePingCommand,
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
