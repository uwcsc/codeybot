import { ApplyOptions } from '@sapphire/decorators';
import { container } from '@sapphire/framework';
import { SubCommandPluginCommand, SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { Message } from 'discord.js';
import _ from 'lodash';
import { getInterviewer, resumeProfile } from '../../components/interviewer';

@ApplyOptions<SubCommandPluginCommandOptions>({
  aliases: ['interviewers', 'int'],
  description: 'Handles interviewer functions',
  detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer\`
\`${container.botPrefix}interviewer frontend\``,
  subCommands: ['clear', 'domain', 'pause', 'profile', 'resume', 'signup', { input: 'list', default: true }]
})
export class InterviewerCommand extends SubCommandPluginCommand {
  async resume(message: Message): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
      return message.reply(
        `you don't seem to have signed up yet, please sign up using \`${container.botPrefix}interviewer signup <calendarUrl>\`!`
      );
    }

    // resume interviewer data
    await resumeProfile(id);
    return message.reply('your interviewer profile has been resumed!');
  }
}
