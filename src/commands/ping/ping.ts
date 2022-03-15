import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions, container } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { enforceNoArgumentsMessage } from '../../utils/arguments';

@ApplyOptions<CommandOptions>({
  aliases: ['pong'],
  description: 'ping pong',
  detailedDescription: `**Examples:**\n
  \`${container.botPrefix}ping\`\n
  \`${container.botPrefix}pong\``
})
export class PingCommand extends Command {
  async messageRun(message: Message, args: Args): Promise<Message> {
    // No arguments
    if (!args.finished) return message.reply(enforceNoArgumentsMessage(this.name));

    const { client } = container;
    const msg = await message.channel.send('Ping?');
    const content = `Pong from JavaScript! Bot Latency ${Math.round(client.ws.ping)}ms. API Latency ${
      msg.createdTimestamp - message.createdTimestamp
    }ms.`;
    return msg.edit(content);
  }
}
