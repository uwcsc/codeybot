import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';
import { parseLink, upsertInterviewer } from '../../components/interview';

class InterviewerSignupCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'interviewer-signup',
      group: 'interviews',
      memberName: 'signup',
      args: [
        {
          key: 'calendarUrl',
          prompt: 'enter your Calendly or x.ai event URL',
          type: 'string'
        }
      ],
      description: 'Adds you to a list of available interviewers.',
      examples: ['.interviewer-signup calendly.com/codey/interview', '.interviewersignup event.x.ai/codey/interview']
    });
  }

  async onRun(message: CommandoMessage, args: { calendarUrl: string }): Promise<Message> {
    // get calendar URL from the 1st capture group
    const { calendarUrl } = args;
    const { id } = message.author;

    //parses link and checks for validity
    const parsedUrl = parseLink(calendarUrl);
    if (!parsedUrl) {
      return message.reply(`Hmmm... I don't seem to recognize your meeting link. Be sure to use calendly or x.ai.`);
    }

    // Add or update interviewer info
    await upsertInterviewer(id, parsedUrl);
    return message.reply(`Your info has been updated. Thanks for helping out!`);
  }
}

export default InterviewerSignupCommand;