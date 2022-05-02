import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions, container } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['fc', 'flip', 'flip-coin', 'coin-flip', 'coinflip'],
  description: 'Flip a coin! In making decisions, if it is not great, at least it is fair!',
  detailedDescription: `**Examples:**
\`${container.botPrefix}flip-coin\`
\`${container.botPrefix}fc\`
\`${container.botPrefix}flip\`
\`${container.botPrefix}coin-flip\`
\`${container.botPrefix}coinflip\`
\`${container.botPrefix}flipcoin\``
})
export class FunFlipCoinCommand extends Command {
  async messageRun(message: Message): Promise<Message> {
    const onHeads = Math.random() < 0.5;
    return message.reply(`The coin landed on **${onHeads ? 'heads' : 'tails'}**!`);
  }
}
