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
      aliases: ['coffeematch'],
      group: 'coffeechats',
      memberName: 'match',
      description: 'Matches current coffee chat roles',
      examples: [`${client.commandPrefix}coffeematch`]
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    if (await validateFutureMatches(this.client)) {
      const { matches, single } = await getNextFutureMatch(this.client);
      for (const pair of matches) {
        await this.alertMatch(pair[0], pair[1]);
      }
      await writeNewMatches(matches);
      if (single) {
        const singleUser = await this.client.users.fetch(single);
        await message.reply(`${singleUser} is single and ready to mingle.`);
      }
      return message.reply(`Sent ${matches.length} match(es).`);
    } else {
      await message.reply('Generated matches depleted/invalid. Regenerating');
      const size = await generateFutureMatches(this.client);
      return message.reply(`Generated ${size} new matches, run this command again to send matches.`);
    }
  }

  alertMatch = async (personA: string, personB: string): Promise<void> => {
    const userA = await this.client.users.fetch(personA);
    const userB = await this.client.users.fetch(personB);
    await userA.send(`Your match is ${userB}`);
    await userB.send(`Your match is ${userA}`);
  };
}

export default coffeeSignupCommand;
