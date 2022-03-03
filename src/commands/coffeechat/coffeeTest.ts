import { Message, MessageEmbed } from 'discord.js';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { container } from '@sapphire/pieces';
import { testPerformance } from '../../components/coffeechat';
import { EMBED_COLOUR } from '../../utils/embeds';

@ApplyOptions<CommandOptions>({
  aliases: ['coffee-test'],
  description: 'Tests coffeematch.',
  detailedDescription: `**Examples:**\n\`${container.client.options.defaultPrefix}coffeetest 10\``,
  requiredUserPermissions: ['ADMINISTRATOR']
})
export class CoffeeTestCommand extends Command {
  async messageRun(message: Message, args: Args): Promise<Message> {
    // Mandatory argument is size
    const size = await args.rest('integer').catch(() => 'please enter a valid number of test users.');
    if (typeof size === 'string') return message.reply(size);

    const results = await testPerformance(size);
    const output = new MessageEmbed().setColor(EMBED_COLOUR).setTitle('Matches Until Dupe');
    results.forEach((value, key) => {
      output.addField(key, value.toString());
    });
    return message.channel.send({ embeds: [output] });
  }
}
