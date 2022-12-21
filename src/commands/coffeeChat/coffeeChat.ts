// Sapphire Specific:
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { ApplyOptions } from '@sapphire/decorators';
// Sapphire Specific:
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { Args, container } from '@sapphire/framework';
// Sapphire Specific:
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import {
  SubCommandPluginCommand,
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  SubCommandPluginCommandOptions,
} from '@sapphire/plugin-subcommands';
import { Message, MessageEmbed } from 'discord.js';
import { getMatch, testPerformance, writeHistoricMatches } from '../../components/coffeeChat';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';
import { alertMatches } from '../../components/coffeeChat';

@ApplyOptions<SubCommandPluginCommandOptions>({
  aliases: ['coffee'],
  description: 'Handle coffee chat functions.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}coffeechat match\`
\`${container.botPrefix}coffee match\`
\`${container.botPrefix}coffeechat test 5\`
\`${container.botPrefix}coffee test 10\``,
  subCommands: ['match', 'test'],
  requiredUserPermissions: ['ADMINISTRATOR'],
})
// Sapphire Specific:
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
export class CoffeeChatCommand extends SubCommandPluginCommand {
  async match(message: Message): Promise<Message> {
    //makes sure future matches are valid (made for the current group / still has matches left)
    const matches = await getMatch();
    await alertMatches(matches);
    await writeHistoricMatches(matches);
    return message.reply(`Sent ${matches.length} match(es).`);
  }

  async test(message: Message, args: Args): Promise<Message> {
    // Mandatory argument is size
    const size = await args
      .rest('integer')
      .catch(() => 'please enter a valid number of test users.');
    if (typeof size === 'string') return message.reply(size);

    const results = await testPerformance(size);
    const output = new MessageEmbed().setColor(DEFAULT_EMBED_COLOUR).setTitle('Matches Until Dupe');
    results.forEach((value, key) => {
      output.addField(key, value.toString());
    });
    return message.channel.send({ embeds: [output] });
  }
}
