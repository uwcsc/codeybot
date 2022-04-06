import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions, container } from '@sapphire/framework';
import { Message } from 'discord.js';
import { getCoinBalanceByUserId } from '../../components/coin';

@ApplyOptions<CommandOptions>({
  aliases: ['cc', 'coin-balance-check', 'coin-check'],
  description: "Checks a user's Codey coin balance.",
  detailedDescription: `**Examples:**\n
  \`${container.botPrefix}coin-check @Codey\`\n
  \`${container.botPrefix}cc @Codey\``
})
export class CoinCheck extends Command {
  async messageRun(message: Message, args: Args): Promise<Message> {
    // Mandatory argument is user
    const user = await args.rest('user').catch(() => 'please enter a valid user mention or ID for balance check.');
    if (typeof user === 'string') return message.reply(user);

    // Get coin balance
    const balance = await getCoinBalanceByUserId(user.id);
    // Show coin balance
    return message.reply(`${user.username} has ${balance} Codey coins 🪙.`);
  }
}