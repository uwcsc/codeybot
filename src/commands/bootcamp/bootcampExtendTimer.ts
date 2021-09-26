import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { MentorCommand } from '../../utils/commands';

class BootcampExtendTimerCommand extends MentorCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'extend',
      aliases: ['add-time'],
      group: 'bootcamp',
      memberName: 'extend',
      args: [
        {
          key: 'time',
          prompt: 'How much time to add?',
          type: 'string'
        }
      ],
      guildOnly: true,
      description: 'Adds time to the length of the 1 on 1 critique call.'
    });
  }

  async onRun(message: CommandoMessage, args: { time: string }): Promise<Message> {
    const { time } = args;
    const addTime = parseInt(time) || 5;
    if (addTime && 1 <= addTime && addTime <= 30) {
      const chatChannel = message.channel;
      (async (): Promise<void> => {
        const fetched = await chatChannel.messages.fetch({ limit: 100 }).catch(console.log);

        let timer;
        if (fetched) {
          timer = fetched.find((msg: Message) => msg.content.endsWith(' remaining.'));
        }
        if (timer) {
          let minLeft = 1;
          let newTimer = timer.content.replace(/(\d+)+/g, (_match, num: string): string => {
            minLeft = parseInt(num) + addTime;
            return minLeft.toString();
          });
          if (minLeft == 1) newTimer = 'You have **1** minute remaining.';
          timer.edit(newTimer);
        } else {
          message.reply('You must use this command in the text channel corresponding to your 1 on 1 call.');
        }
      })();
      return message.say('Adding ' + addTime);
    } else {
      return message.say('Please set a reasonable time.');
    }
  }
}

export default BootcampExtendTimerCommand;
