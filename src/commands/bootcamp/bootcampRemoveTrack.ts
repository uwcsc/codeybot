import { Message, CategoryChannel } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';
import { toTitleCase } from './utils';

class BootcampRemoveTrackCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'remove-track',
      aliases: ['delete-track'],
      group: 'bootcamp',
      memberName: 'remove-track',
      args: [
        {
          key: 'category',
          prompt: 'What will you name the new category? (all for remove ALL)',
          type: 'string'
        }
      ],
      guildOnly: true,
      description: 'Removes a track category in the server. (--all for delete all)'
    });
  }

  async onRun(message: CommandoMessage, args: { category: string }): Promise<Message> {
    let { category } = args;

    category = toTitleCase(category);
    const guild = message.guild;
    const trackCategory = <CategoryChannel>(
      guild.channels.cache.find((channel) => channel.name === category && channel.type === 'category')
    );
    const trackWait = <CategoryChannel>(
      guild.channels.cache.find((channel) => channel.name === category && channel.type === 'voice')
    );
    const waitingRooms = <CategoryChannel>(
      guild.channels.cache.find((channel) => channel.name.startsWith('Waiting Room') && channel.type === 'category')
    );

    if (!waitingRooms) {
      return message.say('This server does not have a waiting room.');
    }

    if (category === '  All') {
      waitingRooms.children.forEach((trackRoom) => {
        const cat = trackRoom.name;
        const trackCat = <CategoryChannel>(
          guild.channels.cache.find((channel) => channel.name === cat && channel.type === 'category')
        );
        if (trackCat) {
          Promise.all(trackCat.children.map((trackRoom) => trackRoom.delete())).then(() => {
            trackCat.delete();
            trackRoom.delete();
          });
          message.say("Deleted '" + cat + "' track.");
        }
      });

      return message.say('Deleted all tracks.');
    } else if (trackCategory && trackWait) {
      Promise.all(trackCategory.children.map((trackRoom) => trackRoom.delete())).then(() => {
        trackCategory.delete();
        trackWait.delete();
      });

      return message.say("Deleted '" + category + "' track.");
    } else {
      return message.say("There is no '" + category + "' track.");
    }
  }
}

export default BootcampRemoveTrackCommand;
