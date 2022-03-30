import { Message } from 'discord.js';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { adjustCoinBalanceByUserId, getCoinBalanceByUserId, UserCoinEvent } from '../../components/coin';
import { BOT_PREFIX } from '../../bot';

@ApplyOptions<CommandOptions>({
  aliases: ['ca', 'coin-adjust'],
  description: "Adjusts a user's Codey coin balance by an amount.",
  detailedDescription: `**Examples:**\n\`${BOT_PREFIX}coin-adjust @Codey 100\`\n\`${BOT_PREFIX}coin-adjust @Codey -100 Codey broke.\``,
  requiredUserPermissions: ['ADMINISTRATOR']
})
export class CoinAdjustCommand extends Command {
  async messageRun(message: Message, args: Args): Promise<Message> {
    // First mandatory argument is user
    const user = await args.pick('user').catch(() => 'please enter a valid user mention or ID for balance adjustment.');
    if (typeof user === 'string') return message.reply(user);

    // Second mandatory argument is amount
    const amount = await args.pick('integer').catch(() => 'please enter a valid amount to adjust.');
    if (typeof amount === 'string') return message.reply(amount);

    // Third optional argument is reason
    const reason = args.finished ? '' : await args.rest('string');

    // Adjust coin balance
    await adjustCoinBalanceByUserId(
      user.id,
      amount,
      UserCoinEvent.AdminCoinAdjust,
      reason ? reason : null,
      message.author.id
    );
    // Get new balance
    const newBalance = await getCoinBalanceByUserId(user.id);
    return message.reply(`${user.username} now has ${newBalance} Codey coins 🪙.`);
  }
}
