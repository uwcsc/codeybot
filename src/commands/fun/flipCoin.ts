import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions, container } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['fc', 'flip', 'flip-coin', 'coin-flip', 'coinflip'],
  description: 'Flip a coin! In making decisions, if it is not great, at least it is fair!',
  detailedDescription: `**Examples:**\n
  \`${container.botPrefix}flip-coin\`\n
  \`${container.botPrefix}fc\`\n
  \`${container.botPrefix}flip\`\n
  \`${container.botPrefix}coin-flip\`\n
  \`${container.botPrefix}coinflip\`\n
  \`${container.botPrefix}flipcoin\``
})
export class FunFlipCoinCommand extends Command {
  async messageRun(message: Message): Promise<Message> {
    const onHeads = Math.random() < 0.5;
    return message.reply(`The coin landed on **${onHeads ? 'heads' : 'tails'}**!`);
  }
}
