import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';

class GetResumeCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'get-resume-command',
      aliases: ['get-resume', 'resume'],
      group: 'resumes',
      memberName: 'get-resume',
      description: 'Get an example resume!',
      examples: []
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    return message.reply(`This is a message for example resumes!`);
  }
}

export default GetResumeCommand;
