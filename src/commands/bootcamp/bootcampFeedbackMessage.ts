import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';
import { BootcampSettings } from '../../components/bootcamp';

class BootcampFeedbackMessageCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'set-feedback',
      aliases: ['new-feedback', 'feedback-message'],
      group: 'bootcamp',
      memberName: 'set-feedback',
      args: [
        {
          key: 'feedback',
          prompt: 'What should the feedback dm message be?',
          type: 'string'
        }
      ],
      guildOnly: true,
      description: 'Changes the feedback message for mentees.'
    });
  }

  async onRun(message: CommandoMessage, args: { feedback: string }): Promise<Message> {
    const { feedback } = args;
    if (feedback) {
      BootcampSettings.set('feedback_dm', feedback);
      if (feedback == '--none') return message.reply('The feedback dm messages are disabled.');
      message.say('The feedback direct message for mentees will now look like this:');
      return message.reply(feedback);
    } else {
      return message.say('The feedback message cannot be empty, type --none to disable it.');
    }
  }
}

export default BootcampFeedbackMessageCommand;
