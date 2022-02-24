import { Message } from 'discord.js';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { getCoinBalanceByUserId, updateCoinBalanceByUserId, UserCoinEvent } from '../../components/coin';
import { BOT_PREFIX } from '../../bot';

@ApplyOptions<CommandOptions>({
  aliases: ['cu', 'cs', 'coin-update', 'coinset', 'coin-set'],
  description: "Updates a user's Codey coin balance.",
  detailedDescription: `**Examples:**\n\`${BOT_PREFIX}coin-update @Codey 100\`\n\`${BOT_PREFIX}coin-update @Codey 0 Reset Codey's balance.\``,
  requiredUserPermissions: ['ADMINISTRATOR']
})
export class CoinUpdateCommand extends Command {
  async messageRun(message: Message, args: Args): Promise<Message> {
    // First mandatory argument is user
    const user = await args.pick('user').catch(() => 'please enter a valid user mention or ID for balance update.');
    if (typeof user === 'string') return message.reply(user);

    // Second mandatory argument is amount
    const amount = await args.pick('integer').catch(() => 'please enter a valid new balance.');
    if (typeof amount === 'string') return message.reply(amount);

    // Third optional argument is reason
    const reason = args.finished ? '' : await args.rest('string');

    // Update coin balance
    await updateCoinBalanceByUserId(
      user.id,
      amount,
      UserCoinEvent.AdminCoinUpdate,
      reason ? reason : null,
      message.author.id
    );
    // Get new balance
    const newBalance = await getCoinBalanceByUserId(user.id);
    return message.reply(`${user.username} now has ${newBalance} Codey coins 🪙.`);
  }
}
