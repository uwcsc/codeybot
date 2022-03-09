import { Message } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { BOT_PREFIX } from '../../bot';

@ApplyOptions<CommandOptions>({
  aliases: ['fc', 'flip', 'flip-coin', 'coin-flip', 'coinflip'],
  description: 'Flip a coin! In making decisions, if it is not great, at least it is fair!',
  detailedDescription: `**Example:** \`${BOT_PREFIX}flip-coin\`\n
  \`${BOT_PREFIX}fc\`\n
  \`${BOT_PREFIX}flip\`\n
  \`${BOT_PREFIX}coin-flip\`\n
  \`${BOT_PREFIX}coinflip\`\n
  \`${BOT_PREFIX}flipcoin\`\n
  `
})
export class FunFlipCoinCommand extends Command {
  async messageRun(message: Message): Promise<Message> {
    const onHeads = Math.random() < 0.5;
    return message.reply(`The coin landed on **${onHeads ? 'heads' : 'tails'}**!`);
  }
}
