import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { pauseProfile, getInterviewer } from '../../components/interview';

class InterviewerPauseCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'interviewer-pause',
      group: 'interviews',
      memberName: 'pause',
      description: 'Pauses your interviewer profile.',
      examples: [`${client.commandPrefix}interviewer-pause`]
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
      return await message.reply(
        `you don't seem to have signed up yet, please sign up using \`${this.client.commandPrefix}interviewer-signup <calendarUrl>\`!`
      );
    }

    // pause interviewer data
    await pauseProfile(id);
    return await message.reply('your interviewer profile has been paused!');
  }
}

export default InterviewerPauseCommand;
