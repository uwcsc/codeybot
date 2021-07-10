import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { genMatches } from '../../components/coffeechat';
import { BaseCommand } from '../../utils/commands';

class coffeeSignupCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'coffee-signup',
      group: 'coffeechats',
      memberName: 'signup',
      description: 'Opts you into monthly coffee chats',
      examples: [`${client.commandPrefix}coffeesignup`]
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    console.log(await genMatches(this.client));
    return message.channel.send('Ree');
  }
}

export default coffeeSignupCommand;
