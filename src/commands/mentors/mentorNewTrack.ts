import { Message, CategoryChannel, Permissions } from 'discord.js';
import { CommandoClient, CommandoGuild, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';


class MentorNewTrackCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'new-track',
      group: 'mentor',
      memberName: 'new-track',
      args: [
        {
          key: 'category',
          prompt: 'What will you name the new category?',
          type: 'string'
        }
      ],
      description: 'Adds an  to the server for Mentors.',
      examples: [`${client.commandPrefix}mentor I want a new Discord channel named #hobbies!`]
    });
  }

  async onRun(message: CommandoMessage, args: { category: string }): Promise<Message> {
    let { category } = args;

    category = toTitleCase(category)
    let guild = message.guild;

    const trackCategory = <CategoryChannel>guild.channels.cache.find(channel => channel.name === category && channel.type === "category");
    const waitingRooms = <CategoryChannel>guild.channels.cache.find(channel => channel.name === "Waiting Rooms" && channel.type === "category");
    
    if (!waitingRooms) {
      return message.say("This server does not have a waiting room.");
    }
    
    if (trackCategory) {
      return message.say("This channel category already exists.");
    } else {
      guild.channels.create(category, {
        type: "voice",
        parent: waitingRooms,
      })
      .catch(console.error);

      guild.channels.create(category, {
        type: "category",
      })
      .then(newCategory => {
        guild.channels.create(category?.replace(/ +/g, '-').toLocaleLowerCase() + "-queue", {
          parent: newCategory,
          permissionOverwrites: [
            {
              id: guild.roles.everyone,
              deny: [Permissions.FLAGS.VIEW_CHANNEL],
            },
          ],
        })
        .catch(console.error);

        guild.channels.create("muted-vc", {
          parent: newCategory,
        })
        .catch(console.error);

        guild.channels.create("Call 0", {
          type: "voice",
          userLimit: 2,
          parent: newCategory,
          permissionOverwrites: [
            {
              id: guild.roles.everyone,
              deny: [Permissions.FLAGS.CONNECT],
            },
          ],
        })
        .catch(console.error);
      })
      .catch(console.error);
      
      return message.say("New category created!");
    }
  }
}

function toTitleCase(str: string) {
  return str.replace(/-/g, ' ').replace(
    /\w\S*/g,
    function(txt: string) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

export default MentorNewTrackCommand;
