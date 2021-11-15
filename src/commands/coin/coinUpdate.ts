import { Message, User } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';
import {
  getCoinBalanceByUserId,
  updateCoinBalanceByUserId,
  updateUserCoinLedger,
  UserCoinEvent
} from '../../components/coin';

class CoinBalanceCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'coin-update',
      aliases: ['cu', 'cs', 'coinupdate', 'coinset', 'coin-set'],
      group: 'coin',
      memberName: 'coin-update',
      description: "Updates a user's Codey coin balance.",
      examples: [
        `${client.commandPrefix}coin-update @Codey 100`,
        `${client.commandPrefix}coin-update @Codey 0 Reset Codey's balance.`
      ],
      args: [
        {
          key: 'user',
          prompt: `tag the user for the balance update.`,
          type: 'user'
        },
        {
          key: 'amount',
          prompt: 'enter the new balance.',
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
    // Get old balance
    const oldBalance = await getCoinBalanceByUserId(user.id);
    // Update coin balance
    await updateCoinBalanceByUserId(user.id, amount);
    // Get new balance
    const newBalance = await getCoinBalanceByUserId(user.id);
    await updateUserCoinLedger(
      user.id,
      newBalance - oldBalance,
      UserCoinEvent.CoinUpdate,
      reason ? reason : null,
      message.author.id
    );
    return message.reply(`${user.username} now has ${newBalance} Codey coins 🪙.`);
  }
}

export default CoinBalanceCommand;
