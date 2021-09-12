import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { loadMatched, loadNotMatched, randomMatch, stableMatch, writeNewMatches } from '../../components/coffeechat';
import { BaseCommand } from '../../utils/commands';

class coffeeSignupCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'coffee-match',
      group: 'coffeechats',
      memberName: 'match',
      description: 'Matches current coffee chat roles',
      examples: [`${client.commandPrefix}coffeematch`]
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    const userList = await loadNotMatched(this.client);
    const matched = await loadMatched(userList);
    const matches = await stableMatch(userList, matched);
    console.log(matches);
    await writeNewMatches(matches);
    // for (const [personA, personB] of matches) {
    //   this.alertMatch(personA, personB);
    // }
    return message.channel.send('Ree');
  }

  alertMatch = async (personA: string, personB: string): Promise<void> => {
    const userA = await this.client.users.fetch(personA);
    const userB = await this.client.users.fetch(personB);
    await userA.send(`Your match is <@${userB.id}>`);
    await userB.send(`Your match is <@${userA.id}>`);
  };
}

export default coffeeSignupCommand;
