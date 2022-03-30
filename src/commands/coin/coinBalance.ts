import { Message } from 'discord.js';
import { Command, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { getCoinBalanceByUserId } from '../../components/coin';
import { BOT_PREFIX } from '../../bot';

@ApplyOptions<CommandOptions>({
  aliases: ['bal', 'balance', 'coins', 'coin-balance'],
  description: 'Shows your Codey coin balance.',
  detailedDescription: `**Examples:**\n\`${BOT_PREFIX}coin\`\n\`${BOT_PREFIX}bal\`\n\`${BOT_PREFIX}balance\``
})
export class CoinBalanceCommand extends Command {
  async messageRun(message: Message): Promise<Message> {
    // Get coin balance
    const balance = await getCoinBalanceByUserId(message.author.id);
    // Show coin balance
    return message.reply(`you have ${balance} Codey coins 🪙.`);
  }
}
