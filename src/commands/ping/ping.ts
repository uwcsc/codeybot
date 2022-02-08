import { Command } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class PingCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: ['pong'],
      description: 'ping pong'
    });
  }

  public async messageRun(message: Message): Promise<Message> {
    const msg = await message.channel.send('Ping?');

    const content = `Pong from JavaScript! Bot Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${
      msg.createdTimestamp - message.createdTimestamp
    }ms.`;

    return msg.edit(content);
  }
}
