import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';
import { BootcampSettings } from '../../components/bootcamp';

class BootcampToggleWatchCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'toggle-watch',
      aliases: ['display-line'],
      group: 'bootcamp',
      memberName: 'toggle-watch',
      guildOnly: true,
      description: 'Toggles codeybot to update the waiting room info!'
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    const updateWaiting = await BootcampSettings.get('update_waiting_times');
    if (updateWaiting) {
      BootcampSettings.set('update_waiting_times', !updateWaiting);
      return message.say('The waiting room info will **stop** updating!');
    } else {
      BootcampSettings.set('update_waiting_times', true);
      return message.say('The waiting room info will **start** updating!');
    }
  }
}

export default BootcampToggleWatchCommand;
