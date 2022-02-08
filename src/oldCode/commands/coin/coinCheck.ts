import { Message, User } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';
import { getCoinBalanceByUserId } from '../../components/coin';

class CoinCheck extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'coin-check',
      aliases: ['cc', 'coin-balance-check', 'coincheck'],
      group: 'coin',
      memberName: 'coin-check',
      description: "Checks a user's Codey coin balance.",
      examples: [`${client.commandPrefix}coin-check @Codey`, `${client.commandPrefix}cc @Codey`],
      args: [
        {
          key: 'user',
          prompt: `tag the user you want to check.`,
          type: 'user'
        }
      ]
    });
  }

  async onRun(message: CommandoMessage, args: { user: User }): Promise<Message> {
    const { user } = args;
    // Get coin balance
    const balance = await getCoinBalanceByUserId(user.id);
    // Show coin balance
    return message.reply(`${user.username} has ${balance} Codey coins 🪙.`);
  }
}

export default CoinCheck;
