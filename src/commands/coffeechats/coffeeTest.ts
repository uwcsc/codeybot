import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import {
  hasDupe,
  loadMatched,
  randomMatch,
  stableMatch,
  wipeHistory,
  writeNewMatches
} from '../../components/coffeechat';
import { BaseCommand } from '../../utils/commands';
import { parseNumArg, validateNumArg } from './utils';

class coffeeSignupCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'coffee-test',
      group: 'coffeechats',
      memberName: 'test',
      args: [
        {
          key: 'size',
          prompt: `enter an integer.`,
          type: 'integer',
          validate: validateNumArg,
          parse: parseNumArg
        }
      ],
      description: 'Tests coffeematch',
      examples: [`${client.commandPrefix}coffeetest 10`]
    });
  }

  //warning: wipes existing matches for coffeechat
  async onRun(message: CommandoMessage, args: { size: number }): Promise<Message> {
    await wipeHistory();
    const { size } = args;
    const userList: Map<string, number> = new Map();
    Array.from(Array(size).keys()).forEach((value: number) => {
      userList.set(`${value}`, value);
    });
    let tally = 0;
    while (true) {
      tally += 1;
      const matched = await loadMatched(userList);
      const matches = await stableMatch(userList, matched);
      await writeNewMatches(matches);
      if (await hasDupe(matches, userList)) break;
    }
    message.channel.send(`STABLE Matched users ${tally} times before encountering dupe`);
    await wipeHistory();
    tally = 0;
    while (true) {
      tally += 1;
      const matches = await randomMatch(userList);
      await writeNewMatches(matches);
      if (await hasDupe(matches, userList)) break;
    }
    return message.channel.send(`RANDOM Matched users ${tally} times before encountering dupe`);
  }
}

export default coffeeSignupCommand;
