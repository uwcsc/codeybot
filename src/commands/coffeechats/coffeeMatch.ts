import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { writeHistoricMatches, getMatch } from '../../components/coffeechat';
import { AdminCommand } from '../../utils/commands';
import _ from 'lodash';

class coffeeMatchCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'coffee-match',
      aliases: ['coffeematch'],
      group: 'coffeechats',
      memberName: 'match',
      description: 'Matches current coffee chat roles',
      examples: [`${client.commandPrefix}coffeematch`]
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    //makes sure future matches are valid (made for the current group / still has matches left)
    const matches = await getMatch(this.client);
    await this.alertMatches(matches);
    await writeHistoricMatches(matches);
    return message.reply(`Sent ${matches.length} match(es).`);
  }

  alertMatches = async (matches: string[][]): Promise<void> => {
    const outputMap: Map<string, string[]> = new Map();
    //map them to find what to send a specific person
    matches.forEach((pair) => {
      if (!outputMap.get(pair[0])) outputMap.set(pair[0], []);
      if (!outputMap.get(pair[1])) outputMap.set(pair[1], []);
      outputMap.get(pair[0])!.push(pair[1]);
      outputMap.get(pair[1])!.push(pair[0]);
    });
    //send out messages
    outputMap.forEach(async (targets, user) => {
      const discordUser = await this.client.users.fetch(user);
      //we use raw discord id ping format to minimize fetch numbers on our end
      targets = targets.map((value) => `<@${value}>`);
      if (targets.length > 1) {
        await discordUser.send(`Your coffee chat matches for this week are ${_.join(targets, ' and ')}`);
      } else {
        await discordUser.send(`Your coffee chat match for this week is ${targets[0]}`);
      }
    });
  };
}

export default coffeeMatchCommand;
