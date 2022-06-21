import { ApplyOptions } from '@sapphire/decorators';
import { Command, container } from '@sapphire/framework';
import { Message } from 'discord.js';
import { APIMessage } from 'discord-api-types/v9';
import { isMessageInstance } from '@sapphire/discord.js-utilities';

@ApplyOptions<Command.Options>({
  aliases: ['pong'],
  description: 'ping pong',
  detailedDescription: `**Examples:**
    \`${container.botPrefix}ping\`
    \`${container.botPrefix}pong\``,
  chatInputCommand: {
    register: true
  }
})

export class PingCommand extends Command {

  // Regular command (.ping)
  public async messageRun(message: Message) {
    const { client } = container;
    const msg = await message.channel.send('Ping?');
    const content = `Pong from JavaScript! Bot Latency ${Math.round(client.ws.ping)}ms. API Latency ${
      msg.createdTimestamp - message.createdTimestamp
    }ms.`;
    return msg.edit(content);
  }

  // Slash command (/ping)
  public async chatInputRun(interaction: Command.ChatInputInteraction): Promise<APIMessage | Message<boolean>> {
    const msg = await interaction.reply({ content: `Ping?`, ephemeral: true, fetchReply: true });
    if (isMessageInstance(msg)) {
      const diff = msg.createdTimestamp - interaction.createdTimestamp;
      const ping = Math.round(this.container.client.ws.ping);

      return interaction.editReply(`Pong 🏓! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`);
    }
    return interaction.editReply('Failed to retrieve ping :(');
  }
}
