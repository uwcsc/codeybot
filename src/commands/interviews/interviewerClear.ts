import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { clearProfile, getInterviewer } from '../../components/interview';

class InterviewerClearCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'interviewer-clear',
      aliases: ['int-clear', 'intclear', 'interviewerclear'],
      group: 'interviews',
      memberName: 'clear',
      description: 'Clears your interviewer profile.',
      examples: [`${client.commandPrefix}interviewer-clear`]
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
      return message.reply(
        `you don't seem to have signed up yet, please sign up using \`${this.client.commandPrefix}interviewer-signup <calendarUrl>\`!`
      );
    }

    // clear interviewer data
    await clearProfile(id);
    return message.reply('your interviewer profile has been cleared!');
  }
}

export default InterviewerClearCommand;
