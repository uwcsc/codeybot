import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';
import { BootcampSettings } from '../../components/bootcamp';

class BootcampSetTimerCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'set-timer',
      aliases: ['new-timer'],
      group: 'bootcamp',
      memberName: 'set-timer',
      args: [
        {
          key: 'time',
          prompt: 'How long should the 1 on 1 calls be?',
          type: 'string'
        }
      ],
      guildOnly: true,
      description: 'Changes the length of the 1 on 1 critique call timer.'
    });
  }

  async onRun(message: CommandoMessage, args: { time: string }): Promise<Message> {
    const { time } = args;
    const newTime = parseInt(time);
    if (newTime && 5 <= newTime && newTime <= 100) {
      BootcampSettings.set('critique_time', newTime);
      return message.reply('ALL calls are now set to **' + newTime + '** minutes.');
    } else {
      return message.say('Please set a reasonable time.');
    }
  }
}

export default BootcampSetTimerCommand;
