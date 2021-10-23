import { Message, User } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';
import { adjustrCoinBalanceByUserId, getCoinBalanceByUserId } from '../../components/coin';

class CoinBalanceCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'coin-adjust',
      aliases: ['ca', 'coinadjust'],
      group: 'coin',
      memberName: 'coin-adjust',
      description: "Adjusts a user's Codey coin balance by an amount.",
      examples: [`${client.commandPrefix}coin-update @Codey 100`, `${client.commandPrefix}coin-update @Codey -100`],
      args: [
        {
          key: 'user',
          prompt: `tag the user for the balance adjustment.`,
          type: 'user'
        },
        {
          key: 'amount',
          prompt: 'enter the amount to adjust.',
          type: 'integer'
        }
      ]
    });
  }

  async onRun(message: CommandoMessage, args: { user: User; amount: number }): Promise<Message> {
    const { user, amount } = args;
    // Update coin balance
    await adjustrCoinBalanceByUserId(user.id, amount);
    // Get new balance
    const newBalance = await getCoinBalanceByUserId(message.author.id);
    return message.reply(`${user.username} now has ${newBalance} Codey coins 🪙.`);
  }
}

export default CoinBalanceCommand;
