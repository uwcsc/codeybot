import { Message, CategoryChannel, Permissions } from 'discord.js';
import { CommandoClient, CommandoGuild, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';
import { toTitleCase } from './utils';

class MentorRemoveTrackCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'remove-track',
      aliases: ['delete-track'],
      group: 'mentor',
      memberName: 'remove-track',
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
    console.log(category)
    const trackCategory = <CategoryChannel>guild.channels.cache.find(channel => channel.name === category && channel.type === "category");
    const trackWait = <CategoryChannel>guild.channels.cache.find(channel => channel.name === category && channel.type === "voice");
    const waitingRooms = <CategoryChannel>guild.channels.cache.find(channel => channel.name.startsWith("Waiting Room") && channel.type === "category");
    
    if (!waitingRooms) {
      return message.say("This server does not have a waiting room.");
    }

    if (category === "All") {
      waitingRooms.children.forEach( trackRoom => {
        const cat = trackRoom.name;
        let trackCat = <CategoryChannel>guild.channels.cache.find(channel => channel.name === cat && channel.type === "category");
        if (trackCat) {
          Promise.all(trackCat.children.map( trackRoom => trackRoom.delete() ))
          .then((results) => {
            trackCat.delete();
            trackRoom.delete();
          })
          message.say("Deleted '" + cat + "' track.");
        }
      })

      return message.say("Deleted all tracks.");
    } else if (trackCategory && trackWait) {
      Promise.all(trackCategory.children.map( trackRoom => trackRoom.delete() ))
      .then((results) => {
        trackCategory.delete();
        trackWait.delete();
      })

      return message.say("Deleted '" + category + "' track.");
    } else {
      return message.say("There is no '" + category + "' track.");
    }
  }
}

export default MentorRemoveTrackCommand;
