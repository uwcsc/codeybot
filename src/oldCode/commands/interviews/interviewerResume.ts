import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { resumeProfile, getInterviewer } from '../../components/interview';

class InterviewerResumeCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'interviewer-resume',
      aliases: ['int-resume', 'intresume', 'interviewerresume'],
      group: 'interviews',
      memberName: 'resume',
      description: 'Resumes your interviewer profile. You will appear in interviewer queries again.',
      examples: [`${client.commandPrefix}interviewer-resume`]
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

    // resume interviewer data
    await resumeProfile(id);
    return message.reply('your interviewer profile has been resumed!');
  }
}

export default InterviewerResumeCommand;
