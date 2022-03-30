import { Message, MessageEmbed } from 'discord.js';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { testPerformance } from '../../components/coffeeChat';
import { EMBED_COLOUR } from '../../utils/embeds';
import { BOT_PREFIX } from '../../bot';

@ApplyOptions<CommandOptions>({
  aliases: ['coffee-test', 'coffeetest', 'coffee-chat-test'],
  description: 'Tests coffeechatmatch, displaying the number of rounds before there is a duplicate.',
  detailedDescription: `**Examples:**\n\`${BOT_PREFIX}coffeetest 10\``,
  requiredUserPermissions: ['ADMINISTRATOR']
})
export class CoffeeChatTestCommand extends Command {
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
