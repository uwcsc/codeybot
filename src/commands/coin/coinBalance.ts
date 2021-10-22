import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { getCoinBalanceByUserId } from '../../components/coin';

class CoinBalanceCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'coin',
      aliases: ['bal', 'balance', 'coins'],
      group: 'coin',
      memberName: 'coin-balance',
      description: 'Shows your Codey coin balance.',
      examples: [`${client.commandPrefix}coin`, `${client.commandPrefix}bal`, `${client.commandPrefix}balance`]
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    // Get coin balance
    const balance = await getCoinBalanceByUserId(message.author.id);
    // Show coin balance
    return message.reply(`you have ${balance} Codey coins 🪙.`);
  }
}

export default CoinBalanceCommand;
