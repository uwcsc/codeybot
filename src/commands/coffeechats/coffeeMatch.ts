import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { writeHistoricMatches, getMatch } from '../../components/coffeechat';
import { AdminCommand } from '../../utils/commands';

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
    const { matches, single } = await getMatch(this.client);
    for (const pair of matches) {
      await this.alertMatch(pair[0], pair[1]);
    }
    await writeHistoricMatches(matches);
    if (single) {
      const singleUser = await this.client.users.fetch(single);
      await message.reply(`${singleUser} is single and ready to mingle.`);
    }
    return message.reply(`Sent ${matches.length} match(es).`);
  }

  alertMatch = async (personA: string, personB: string): Promise<void> => {
    const userA = await this.client.users.fetch(personA);
    const userB = await this.client.users.fetch(personB);
    await userA.send(`Your match is ${userB}`);
    await userB.send(`Your match is ${userA}`);
  };
}

export default coffeeMatchCommand;
