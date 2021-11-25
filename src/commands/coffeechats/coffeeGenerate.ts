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
      description: 'Generates coffeechat matchings until a dupe is encountered',
      examples: [`${client.commandPrefix}coffeegenerate`]
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    const size = await generateFutureMatches(this.client);
    return message.reply(`Generated ${size} matches.`);
  }
}

export default coffeeSignupCommand;
