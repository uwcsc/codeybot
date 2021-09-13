import { Message, VoiceChannel, TextChannel, CategoryChannel, Permissions, GuildMember } from 'discord.js';
import { CommandoClient, CommandoGuild, CommandoMessage } from 'discord.js-commando';
import { AdminCommand, MentorCommand } from '../../utils/commands';
import logger, { logError } from '../../components/logger';
import { mentorRole } from '../../bot';
import { lowestInt } from './utils';

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
      const foundCall = callChannels.find(channel => channel.members.filter(member => member.roles.cache.map(role => role.id).includes(mentorRole) ).size === 0)
      if (foundCall) {
        mentor?.setChannel(foundCall)
      } else {
        console.log(callChannels.map(c => Number(c.name.split(" ")[1])));
        const callNum = lowestInt(callChannels.map(c => Number(c.name.split(" ")[1])));

        const mentorMember = <GuildMember>mentor.member;
        guild.channels.create("Call " + callNum, {
          type: "voice",
          userLimit: 2,
          position: callNum*2+10,
          parent: trackCategory,
          permissionOverwrites: [
            {
              id: guild.roles.everyone,
              deny: [Permissions.FLAGS.VIEW_CHANNEL],
            },
          ],
        })
        .then(newCall => {
          mentor?.setChannel(newCall);
          guild.channels.create("call-" + callNum + "-vc", {
            parent: trackCategory,
            position: callNum*2+10,
            permissionOverwrites: [
              {
                id: guild.roles.everyone,
                deny: [Permissions.FLAGS.VIEW_CHANNEL],
              },
              {
                id: mentorMember,
                allow: [Permissions.FLAGS.VIEW_CHANNEL],
              },
            ],
          })
          .catch(console.error);
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
