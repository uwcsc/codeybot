import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, container } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { isMessageInstance } from '@sapphire/discord.js-utilities';

import { vars } from '../../config';

@ApplyOptions<Command.Options>({
  aliases: ['ping'],
  description: 'ping pong',
  detailedDescription: `**Examples:**
    \`${container.botPrefix}ping\`
    \`${container.botPrefix}pong\``,
  chatInputCommand: {
    register: true
  }
})

export class PingCommand extends Command {

  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    const msg = await interaction.reply({ content: `Ping?`, ephemeral: true, fetchReply: true });
    if (isMessageInstance(msg)) {
      const diff = msg.createdTimestamp - interaction.createdTimestamp;
      const ping = Math.round(this.container.client.ws.ping);

      return interaction.editReply(`Pong 🏓! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`);
    }
    return interaction.editReply('Failed to retrieve ping :(');
  }

}
