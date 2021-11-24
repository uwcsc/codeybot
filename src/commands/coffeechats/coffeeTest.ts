import { Message, MessageEmbed } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { testPerformance } from '../../components/coffeechat';
import { AdminCommand } from '../../utils/commands';
import { EMBED_COLOUR } from '../../utils/embeds';
import { parseNumArg, validateNumArg } from './utils';

class coffeeSignupCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'coffee-test',
      aliases: ['coffeetest'],
      group: 'coffeechats',
      memberName: 'test',
      args: [
        {
          key: 'size',
          prompt: `enter an integer.`,
          type: 'integer',
          validate: validateNumArg,
          parse: parseNumArg
        }
      ],
      description: 'Tests coffeematch',
      examples: [`${client.commandPrefix}coffeetest 10`]
    });
  }

  async onRun(message: CommandoMessage, args: { size: number }): Promise<Message> {
    const { size } = args;
    const results = await testPerformance(size);
    const output = new MessageEmbed().setColor(EMBED_COLOUR).setTitle('Matches Until Dupe');
    results.forEach((value, key) => {
      output.addField(key, value);
    });
    return message.channel.send(output);
  }
}

export default coffeeSignupCommand;
