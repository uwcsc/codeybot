import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { BaseCommand } from '../../utils/commands';

class BootcampExtendTimerCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'extend',
      aliases: ['add-time'],
      group: 'bootcamp',
      memberName: 'extend',
      guildOnly: true,
      description: 'Adds time to the length of the 1 on 1 critique call.'
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    const addTime = 7;
    if (addTime && 1 <= addTime && addTime <= 30) {
      const chatChannel = message.channel;
      (async (): Promise<void> => {
        const fetched = await chatChannel.messages.fetch({ limit: 100 }).catch(console.log);

        let timer;
        if (fetched) {
          timer = fetched.find((msg: Message) => msg.content.endsWith(' remaining.'));
          const extendsUsed = fetched.filter((msg: Message) => msg.content.endsWith('Time added!'));

          if (
            !extendsUsed.every((mesg) => {
              if (mesg.mentions.users.get(message.author.id)) {
                return false;
              }
              return true;
            })
          ) {
            message.reply('You already extended the time.');
            return;
          }
        }
        if (timer) {
          let minLeft = 1;
          const newTimer = timer.content.replace(/(\d+)+/g, (_match, num: string): string => {
            minLeft = parseInt(num) + addTime;
            return minLeft.toString();
          });
          timer.edit(newTimer);
          message.reply('Time added!');
        } else {
          message.reply('You must use this command in the text channel corresponding to your 1 on 1 call.');
        }
      })();
      return message.say('Adding 7 minutes...');
    } else {
      return message.say('Please set a reasonable time.');
    }
  }
}

export default BootcampExtendTimerCommand;
