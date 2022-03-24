import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions, container } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['pong'],
  description: 'ping pong',
  detailedDescription: `**Examples:**\n
  \`${container.botPrefix}ping\`\n
  \`${container.botPrefix}pong\``
})
export class PingCommand extends Command {
  async messageRun(message: Message): Promise<Message> {
    const { client } = container;
    const msg = await message.channel.send('Ping?');
    const content = `Pong from JavaScript! Bot Latency ${Math.round(client.ws.ping)}ms. API Latency ${
      msg.createdTimestamp - message.createdTimestamp
    }ms.`;
    return msg.edit(content);
  }
}
