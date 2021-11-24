import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { generateFutureMatches } from '../../components/coffeechat';
import { AdminCommand } from '../../utils/commands';

class coffeeSignupCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'coffee-generate',
      aliases: ['coffeegenerate'],
      group: 'coffeechats',
      memberName: 'generate',
      description: 'Generates coffeechat matchings for the next N weeks',
      args: [
        {
          key: 'size',
          prompt: `enter an integer.`,
          type: 'integer'
        }
      ],
      examples: [`${client.commandPrefix}coffeegenerate`]
    });
  }

  async onRun(message: CommandoMessage, args: { size: number }): Promise<Message> {
    const { size } = args;
    await generateFutureMatches(this.client, size);
    return message.reply(`Generated ${size} matches.`);
  }
}

export default coffeeSignupCommand;
