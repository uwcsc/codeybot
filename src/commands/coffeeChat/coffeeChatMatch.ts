import { Message, User } from 'discord.js';
import { Command, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { container } from '@sapphire/pieces';
import { writeHistoricMatches, getMatch } from '../../components/coffeeChat';

@ApplyOptions<CommandOptions>({
  aliases: ['coffee-match', 'coffeematch', 'coffee-chat-match'],
  description: 'Matches members with the coffee chat role.',
  detailedDescription: `**Examples:**\n\`${container.client.options.defaultPrefix}coffeematch\``,
  requiredUserPermissions: ['ADMINISTRATOR']
})
export class CoffeeChatMatchCommand extends Command {
  async messageRun(message: Message): Promise<Message> {
    const { client } = container;
    //makes sure future matches are valid (made for the current group / still has matches left)
    const matches = await getMatch(client);
    await this.alertMatches(matches);
    await writeHistoricMatches(matches);
    return message.reply(`Sent ${matches.length} match(es).`);
  }

  alertMatches = async (matches: string[][]): Promise<void> => {
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
  };
}
