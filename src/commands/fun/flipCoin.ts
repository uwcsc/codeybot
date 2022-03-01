/* eslint-disable prettier/prettier */
import { Message } from 'discord.js';
import { Args, Command} from '@sapphire/framework';
import { BOT_PREFIX } from '../../bot'

class FlipCoinCommand extends Command{
  constructor(context: Command.Context) {
    super(context, {
      name: 'flip-coin',
      aliases: ['fc', 'flip', 'flipcoin', 'coin-flip', 'coinflip'],
      fullCategory: ['fun'],
      description: 'Flip a coin! In making decisions, if it is not great, at least it is fair!',
      detailedDescription: `Example: ${BOT_PREFIX}flip-coin`
    });
  }

  async messageRun(message: Message): Promise<Message> {
    const onHeads = Math.random() < 0.5;
    return message.reply(`The coin landed on **${onHeads ? 'heads' : 'tails'}**!`);
  }
}

export default FlipCoinCommand;
