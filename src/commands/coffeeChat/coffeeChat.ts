import { ApplyOptions } from '@sapphire/decorators';
import { Args, container } from '@sapphire/framework';
import { SubCommandPluginCommand, SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { Message, MessageEmbed, User } from 'discord.js';
import { getMatch, testPerformance, writeHistoricMatches } from '../../components/coffeeChat';
import { EMBED_COLOUR } from '../../utils/embeds';

@ApplyOptions<SubCommandPluginCommandOptions>({
  aliases: ['coffee'],
  description: 'Handles coffee chat functions',
  detailedDescription: `**Examples:**
\`${container.botPrefix}coffeechat match\`
\`${container.botPrefix}coffee match\`
\`${container.botPrefix}coffeechat test 5\`
\`${container.botPrefix}coffee test 10\``,
  subCommands: ['match', 'test'],
  requiredUserPermissions: ['ADMINISTRATOR']
})
export class CoffeeChatCommand extends SubCommandPluginCommand {
  private async alertMatches(matches: string[][]): Promise<void> {
    const { client, logger } = container;
    const outputMap: Map<string, string[]> = new Map();
    const userMap: Map<string, User> = new Map();
    //map them to find what to send a specific person
    for (const pair of matches) {
      if (!outputMap.get(pair[0])) {
        outputMap.set(pair[0], []);
        userMap.set(pair[0], await client.users.fetch(pair[0]));
      }
      if (!outputMap.get(pair[1])) {
        outputMap.set(pair[1], []);
        userMap.set(pair[1], await client.users.fetch(pair[1]));
      }
      outputMap.get(pair[0])!.push(pair[1]);
      outputMap.get(pair[1])!.push(pair[0]);
    }
    //send out messages
    outputMap.forEach(async (targets, user) => {
      const discordUser = userMap.get(user)!;
      //we use raw discord id ping format to minimize fetch numbers on our end
      const userTargets = targets.map((value) => userMap.get(value)!);
      try {
        if (targets.length > 1) {
          await discordUser.send(
            `Your coffee chat :coffee: matches for this week are... **${userTargets[0].tag}** and **${userTargets[1].tag}**! Feel free to contact ${userTargets[0]} and ${userTargets[1]} at your earliest convenience. :wink:`
          );
        } else {
          await discordUser.send(
            `Your coffee chat :coffee: match for this week is... **${userTargets[0].tag}**! Feel free to contact ${userTargets[0]} at your earliest convenience. :wink:`
          );
        }
      } catch (err) {
        logger.error({
          event: 'client_error',
          error: (err as Error).toString()
        });
      }
    });
  }

  async match(message: Message): Promise<Message> {
    //makes sure future matches are valid (made for the current group / still has matches left)
    const matches = await getMatch();
    await this.alertMatches(matches);
    await writeHistoricMatches(matches);
    return message.reply(`Sent ${matches.length} match(es).`);
  }

  async test(message: Message, args: Args): Promise<Message> {
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
