import { Message, VoiceChannel, TextChannel } from 'discord.js';
import { CommandoClient, CommandoGuild, CommandoMessage } from 'discord.js-commando';
import { MentorCommand } from '../../utils/commands';
import logger, { logError } from '../../components/logger';
import { isGetAccessor } from 'typescript';

class MentorNextCommand extends MentorCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'next',
      group: 'mentor',
      memberName: 'next',
      description: 'Deletes multiple mentor from the server via reactions.'
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    let mentor = message.member?.voice;
    let callChannel = mentor?.channel;
    let guild = message.guild;
    let track = callChannel?.parent?.name

    let front;

    const queueVoice = <VoiceChannel>guild.channels.cache.find(channel => channel.name === track && channel.type === "voice");
    const queueChannel = <TextChannel>callChannel?.parent?.children.find(channel => channel.name === track?.replace(/ +/g, '-').toLocaleLowerCase() + "-queue");
    let queueMembers = queueVoice?.members;
    
    if (queueVoice && queueChannel) {
      if (callChannel?.full) {
        return message.say("You should only have one Mentee at a time.");
      }
      if (queueMembers.size < 1) {
        return message.say("The are no Mentees waiting for this track.");
      }

      queueChannel.messages.fetch({ limit: queueVoice.members.size * 2 + 5 }).then(messages => {
        messages.sorted((mesgA, mesgB) => mesgA.createdTimestamp - mesgB.createdTimestamp).every((mesg): boolean => {
          front = queueMembers.get(mesg.content)
          if (front) {
            let mentorCall = <VoiceChannel>mentor?.channel
            front.voice.setChannel(mentorCall)
            message.reply("please welcome " + front.displayName + "!");
            const chatChannel = <TextChannel>mentorCall?.parent?.children.find(channel => channel.name === mentorCall?.name.replace(/ +/g, '-').toLocaleLowerCase() + "-vc");
            chatChannel.updateOverwrite(front, {
              VIEW_CHANNEL: true,
            })
            return false
          }
          return true
        })
      })

      return message.say("Your 15 minute call has started!");
    } else {
      return message.say("You must be in a Mentor/Mentee call room.");
    }
  }
}

export default MentorNextCommand;
