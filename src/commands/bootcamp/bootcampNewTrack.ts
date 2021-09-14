import { Message, CategoryChannel, Permissions } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';
import { toTitleCase } from './utils';

class BootcampNewTrackCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'new-track',
      aliases: ['add-track'],
      group: 'bootcamp',
      memberName: 'new-track',
      args: [
        {
          key: 'category',
          prompt: 'What will you name the new category?',
          type: 'string'
        }
      ],
      guildOnly: true,
      description: 'Adds a new track category.'
    });
  }

  async onRun(message: CommandoMessage, args: { category: string }): Promise<Message> {
    let { category } = args;

    category = toTitleCase(category);
    const guild = message.guild;

    const waitingRooms = <CategoryChannel>(
      guild.channels.cache.find((channel) => channel.name.startsWith('Waiting Room') && channel.type === 'category')
    );

    if (!waitingRooms) {
      guild.channels.create('Waiting Room', {
        type: 'category'
      });
      return message.say('This server does not have a waiting room.');
    }

    const trackCategory = <CategoryChannel>(
      guild.channels.cache.find((channel) => channel.name === category && channel.type === 'category')
    );

    if (trackCategory) {
      return message.say('This channel category already exists.');
    } else {
      guild.channels
        .create(category, {
          type: 'voice',
          parent: waitingRooms
        })
        .catch(console.error);

      guild.channels
        .create(category, {
          type: 'category'
        })
        .then((newCategory) => {
          guild.channels
            .create(category?.replace(/ +/g, '-').toLocaleLowerCase() + '-queue', {
              parent: newCategory,
              permissionOverwrites: [
                {
                  id: guild.roles.everyone,
                  deny: [Permissions.FLAGS.VIEW_CHANNEL]
                }
              ]
            })
            .catch(console.error);
        })
        .catch(console.error);

      return message.say('New category created!');
    }
  }
}

export default BootcampNewTrackCommand;
