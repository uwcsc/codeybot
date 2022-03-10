import { Message } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { BOT_PREFIX } from '../../bot';
import { isInteger } from 'lodash';

@ApplyOptions<CommandOptions>({
  aliases: ['rd', 'roll', 'roll-dice', 'dice-roll', 'diceroll', 'dice'],
  description: 'Roll a dice!',
  detailedDescription: `**Example:** \`${BOT_PREFIX}roll-dice 6\`\n
  \`${BOT_PREFIX}dice-roll 30\`\n
  \`${BOT_PREFIX}roll 100\`\n
  \`${BOT_PREFIX}rd 4\`\n
  \`${BOT_PREFIX}diceroll 2\`\n
  \`${BOT_PREFIX}dice 1\`\n
  \`${BOT_PREFIX}rolldice 10\`\n
  `
})
export class FunRollDiceCommand extends Command {
  getRandomInt(max: number): number {
    return Math.floor(Math.random() * max) + 1;
  }

  async messageRun(message: Message, args: Args): Promise<Message> {
    const sidesLowerBound = 0;
    const sidesUpperBound = 1000000;
    const sides = await args.pick('integer').catch(() => 6);

    //Argument enforcement
    if (!isInteger(sides) || !args.finished) {
      return message.reply(
        `Invalid Parameters! Usage: \`rolldice <sides>\` \n` +
          `\`sides\` - The number of sides on the dice you wish to roll, ` +
          `must be \`0 < sides <= ${sidesUpperBound}\``
      );
    }
    if (sides <= sidesLowerBound) {
      return message.reply(`I cannot compute ${sides} sides!`);
    }
    if (sides > sidesUpperBound) {
      return message.reply("that's too many sides!");
    }
    const diceFace = this.getRandomInt(sides);
    return message.reply(`you rolled a ${diceFace}!`);
  }
}
