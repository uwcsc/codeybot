import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import {
  generateFutureMatches,
  getNextFutureMatch,
  validateFutureMatches,
  writeNewMatches
} from '../../components/coffeechat';
import { AdminCommand } from '../../utils/commands';

class coffeeSignupCommand extends AdminCommand {
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
    if (await validateFutureMatches(this.client)) {
      const curTime = new Date();
      const matches = await getNextFutureMatch();
      for (const pair of matches) {
        await this.alertMatch(pair[0], pair[1]);
      }
      await writeNewMatches(matches, curTime);
      return message.channel.send(`Sent ${matches.length} match(es).`);
    } else {
      await message.channel.send('Generated matches depleted/invalid. Regenerating');
      await generateFutureMatches(this.client);
      return message.channel.send('Generating finished, run this command again to send matches.');
    }
  }

  alertMatch = async (personA: string, personB: string): Promise<void> => {
    const userA = await this.client.users.fetch(personA);
    const userB = await this.client.users.fetch(personB);
    await userA.send(`Your match is <@${userB.id}>`);
    await userB.send(`Your match is <@${userA.id}>`);
  };
}

export default coffeeSignupCommand;
