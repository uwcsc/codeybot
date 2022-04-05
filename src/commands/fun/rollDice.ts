import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions, container } from '@sapphire/framework';
import { Message } from 'discord.js';
import { isInteger } from 'lodash';

@ApplyOptions<CommandOptions>({
  aliases: ['rd', 'roll', 'roll-dice', 'dice-roll', 'diceroll', 'dice'],
  description: 'Roll a dice!',
  detailedDescription: `**Examples:**\n
  \`${container.botPrefix}roll-dice 6\`\n
  \`${container.botPrefix}dice-roll 30\`\n
  \`${container.botPrefix}roll 100\`\n
  \`${container.botPrefix}rd 4\`\n
  \`${container.botPrefix}diceroll 2\`\n
  \`${container.botPrefix}dice 1\`\n
  \`${container.botPrefix}rolldice 10\``
})
export class FunRollDiceCommand extends Command {
  getRandomInt(max: number): number {
    return Math.floor(Math.random() * max) + 1;
  }

  async messageRun(message: Message, args: Args): Promise<Message> {
    const SIDES_LOWER_BOUND = 0;
    const SIDES_UPPER_BOUND = 1000000;
    const sides = await args.pick('integer').catch(() => 6);

    //Argument enforcement
    if (!isInteger(sides) || !args.finished) {
      return message.reply(
        `Invalid Parameters! Usage: \`rolldice <sides>\` \n` +
          `\`sides\` - The number of sides on the dice you wish to roll, ` +
          `must be \`${SIDES_LOWER_BOUND} < sides <= ${SIDES_UPPER_BOUND}\``
      );
    }
    if (sides <= SIDES_LOWER_BOUND) {
      return message.reply(`I cannot compute ${sides} sides!`);
    }
    if (sides > SIDES_UPPER_BOUND) {
      return message.reply("that's too many sides!");
    }
    const diceFace = this.getRandomInt(sides);
    return message.reply(`you rolled a ${diceFace}!`);
  }
}
