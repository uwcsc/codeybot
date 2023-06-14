import { CodeyUserError } from './../../codeyUserError';
// Sapphire Specific:
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { Args, container } from '@sapphire/framework';
// Sapphire Specific:
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { Subcommand } from '@sapphire/plugin-subcommands';
import { Message, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { getMatch, testPerformance, writeHistoricMatches } from '../../components/coffeeChat';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';
import { alertMatches } from '../../components/coffeeChat';

export class CoffeeChatCommand extends Subcommand {
  public constructor(context: Subcommand.Context, options: Subcommand.Options) {
    super(context, {
      ...options,
      name: 'coffee',
      description: 'Handle coffee chat functions.',
      detailedDescription: `**Examples:**
\`${container.botPrefix}coffee match\`
\`${container.botPrefix}coffee test 10\``,
      subcommands: [
        { name: 'match', messageRun: 'match' },
        { name: 'test', messageRun: 'test' },
      ],
      requiredUserPermissions: [PermissionsBitField.Flags.Administrator],
    });
  }

  async match(message: Message): Promise<Message> {
    //makes sure future matches are valid (made for the current group / still has matches left)
    const matches = await getMatch();
    if (!matches.length)
      return message.reply(`Not enough members with coffee chat role to generate matches.`);
    await alertMatches(matches);
    await writeHistoricMatches(matches);
    return message.reply(`Sent ${matches.length} match(es).`);
  }

  async test(message: Message, args: Args): Promise<Message | void> {
    try {
      // Mandatory argument is size
      const size = await args.rest('integer').catch(() => {
        {
          throw new CodeyUserError(message, 'please enter a valid number of test users.');
        }
      });
      if (typeof size === 'string') return message.reply(size);

      const results = await testPerformance(size);
      const output = new EmbedBuilder()
        .setColor(DEFAULT_EMBED_COLOUR)
        .setTitle('Matches Until Dupe');
      results.forEach((value, key) => {
        output.addFields([{ name: key, value: value.toString() }]);
      });
      return message.channel.send({ embeds: [output] });
    } catch (e) {
      if (e instanceof CodeyUserError) {
        e.sendToUser();
      }
    }
  }
}
