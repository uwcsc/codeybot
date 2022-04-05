import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions, container } from '@sapphire/framework';
import { Message } from 'discord.js';
import { getCoinBalanceByUserId } from '../../components/coin';

@ApplyOptions<CommandOptions>({
  aliases: ['bal', 'balance', 'coins', 'coin-balance'],
  description: 'Shows your Codey coin balance.',
  detailedDescription: `**Examples:**\n
  \`${container.botPrefix}coin\`\n
  \`${container.botPrefix}bal\`\n
  \`${container.botPrefix}balance\``
})
export class CoinBalanceCommand extends Command {
  async messageRun(message: Message): Promise<Message> {
    // Get coin balance
    const balance = await getCoinBalanceByUserId(message.author.id);
    // Show coin balance
    return message.reply(`you have ${balance} Codey coins 🪙.`);
  }
}
