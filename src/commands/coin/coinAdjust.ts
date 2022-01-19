import { Message, User } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';
import { adjustCoinBalanceByUserId, getCoinBalanceByUserId, UserCoinEvent } from '../../components/coin';

class CoinBalanceCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'coin-adjust',
      aliases: ['ca', 'coinadjust'],
      group: 'coin',
      memberName: 'coin-adjust',
      description: "Adjusts a user's Codey coin balance by an amount.",
      examples: [
        `${client.commandPrefix}coin-adjust @Codey 100`,
        `${client.commandPrefix}coin-adjust @Codey -100 Codey broke.`
      ],
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
        },
        {
          key: 'reason',
          prompt: '',
          type: 'string',
          default: ''
        }
      ]
    });
  }

  async onRun(message: CommandoMessage, args: { user: User; amount: number; reason: string }): Promise<Message> {
    const { user, amount, reason } = args;
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

export default CoinBalanceCommand;
