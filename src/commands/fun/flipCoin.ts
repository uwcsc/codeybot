import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';

class FlipCoinCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'flip-coin',
      aliases: ['fc', 'flip', 'flipcoin', 'coin-flip', 'coinflip'],
      group: 'fun',
      memberName: 'flip-coin',
      description: 'Flip a coin! In making decisions, if it is not great, at least it is fair!',
      examples: [`${client.commandPrefix}flip-coin`]
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    const onHeads = Math.random() < 0.5;
    return message.reply(`the coin landed on **${onHeads ? 'heads' : 'tails'}**!`);
  }
}

export default FlipCoinCommand;
