import { container } from '@sapphire/framework';
import { Message } from 'discord.js';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

const pingExecuteCommand: SapphireMessageExecuteType = async (
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

  const apiLatency = initialResponse.createdTimestamp - messageFromUser.createdTimestamp;
  const stringReply = content(botLatency, apiLatency);

  // have to use the original interaction to edit the reply
  // when using slash commands because an ephemeral
  // reply cannot be directly edited
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

export const pingCommandDetails: CodeyCommandDetails = {
  name: 'ping',
  aliases: ['pong'],
  description: 'Ping the bot to see if it is alive. :ping_pong:',
  detailedDescription: `**Examples:**
      \`${container.botPrefix}ping\`
      \`${container.botPrefix}pong\``,

  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Ping?',
  messageIfFailure: 'Failed to receive ping.',
  executeCommand: pingExecuteCommand,
  options: [],
  subcommandDetails: {},
};
