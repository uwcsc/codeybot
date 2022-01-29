import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';

class RollDiceCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'roll-dice',
      aliases: ['rd', 'roll', 'rolldice', 'dice-roll', 'diceroll', 'dice'],
      group: 'fun',
      args: [
        {
          key: 'sides',
          prompt: 'enter the number of sides of the dice',
          type: 'integer'
        }
      ],
      memberName: 'dice-coin',
      description: 'Roll a dice!',
      examples: [`${client.commandPrefix}dice-roll`]
    });
  }

  getRandomInt(max: number): number {
    const roll = Math.floor(Math.random() * (max + 1));
    if (roll == 0) {
      return 1;
    }
    return roll;
  }

  async onRun(message: CommandoMessage, args: {sides: number;}): Promise<Message> {
    const {sides} = args;
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