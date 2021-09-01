import { Message, VoiceChannel, TextChannel, CategoryChannel, Permissions } from 'discord.js';
import { CommandoClient, CommandoGuild, CommandoMessage } from 'discord.js-commando';
import { AdminCommand, MentorCommand } from '../../utils/commands';
import logger, { logError } from '../../components/logger';

class MentorTrackCommand extends MentorCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'track',
      group: 'mentor',
      memberName: 'track',
      args: [
        {
          key: 'category',
          prompt: 'What category are you the most familiar with? Check the waiting rooms for the current categories.',
          type: 'string'
        },
      ],
      description: 'Copies multiple mentor to the server via reactions.',
      examples: [`${client.commandPrefix}track devops`]
    });
  }

  async onRun(message: CommandoMessage, args: { category: string }): Promise<Message> {
    const { category } = args;
    let mentor = message.member?.voice;

    if (!mentor?.channel) {
      return message.say("Join a voice call such as 'Start Here' to choose a track");
    }

    let guild = message.guild;

    const trackCategory = <CategoryChannel>guild.channels.cache.find(channel => channel.name === category?.replace(/ +/g, '-').toLocaleLowerCase() + "-queue")?.parent;
    const callChannels = trackCategory?.children?.filter(channel => channel.type === "voice").map(channel => <VoiceChannel>channel);
    if (trackCategory) {
      const foundCall = callChannels.find(channel => channel.members.size === 0)
      if (foundCall) {
        mentor?.setChannel(foundCall)
      } else {
        guild.channels.create("Call " + callChannels.length, {
          type: "voice",
          userLimit: 2,
          parent: trackCategory,
          permissionOverwrites: [
            {
              id: guild.roles.everyone,
              deny: [Permissions.FLAGS.CONNECT],
            },
          ],
        })
        .then(newCall => {
          mentor?.setChannel(newCall)
        })
        .catch(console.error);
      }

      return message.reply("You joined the " + category + " track.")
    } else {
      return message.say("That category does not exist. Check the waiting rooms for the current categories.");
    }
  }
}

export default MentorTrackCommand;
