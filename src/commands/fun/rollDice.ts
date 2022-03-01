/* eslint-disable prettier/prettier */
import { Message } from 'discord.js';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { BOT_PREFIX } from '../../bot'

class RollDiceCommand extends Command {
  constructor(context: Command.Context) {
    super(context, {
      name: 'roll-dice',
      aliases: ['rd', 'roll', 'rolldice', 'dice-roll', 'diceroll', 'dice'],
      fullCategory: ['fun'],
      description: 'Roll a dice!',
      detailedDescription: `Example: ${BOT_PREFIX} roll-dice <size>`
    });
  }


  getRandomInt(max: number): number {
    return Math.floor(Math.random() * max) + 1;
  }

  async messageRun(message: Message, args: Args): Promise<Message> {
    const sides = await args.pick('number').catch(() => 6);
    if (sides <= 0) {
      return message.reply(`I cannot compute ` + sides + ' sides!');
    }
    if (sides > 1000000) {
      return message.reply(`that's too many sides!`);
    }
    const diceFace = this.getRandomInt(sides);
    return message.reply(`you rolled a ` + diceFace + `!`);
  }
}

export default RollDiceCommand;
