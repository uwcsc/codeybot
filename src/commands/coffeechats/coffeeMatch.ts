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
      const curTime = new Date();
      const { matches, single } = await getNextFutureMatch(this.client);
      for (const pair of matches) {
        await this.alertMatch(pair[0], pair[1]);
      }
      await writeNewMatches(matches, curTime);
      if (single) {
        const singleUser = await this.client.users.fetch(single);
        await message.reply(`<@${singleUser.id}> is single and ready to mingle.`);
      }
      return message.reply(`Sent ${matches.length} match(es).`);
    } else {
      await message.reply('Generated matches depleted/invalid. Regenerating');
      await generateFutureMatches(this.client);
      return message.reply('Generating finished, run this command again to send matches.');
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
