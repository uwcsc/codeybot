import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { clearProfile } from '../../components/interview';

class InterviewerClearCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'interviewer-clear',
      group: 'interviews',
      memberName: 'clear',
      description: 'Clears your interviewer profile.',
      examples: ['.interviewer-clear']
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    const { id } = message.author;

    // clear interviewer data
    await clearProfile(id);
    return await message.reply('your interviewer profile has been cleared!');
  }
}

export default InterviewerClearCommand;
