import { Message, VoiceChannel, TextChannel, GuildMember } from 'discord.js';
import { CommandoClient, CommandoGuild, CommandoMessage } from 'discord.js-commando';
import { MentorCommand } from '../../utils/commands';
import logger, { logError } from '../../components/logger';
import { isGetAccessor } from 'typescript';
import { eventMentors } from '../../bot'

class MentorKickCommand extends MentorCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'kick',
      aliases: ['remove'],
      group: 'mentor',
      memberName: 'kick',
      description: 'Deletes multiple mentor from the server via reactions.'
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    let mentor = message.member;
    let callChannel = mentor?.voice?.channel;
    let guild = message.guild;
    let track = callChannel?.parent?.name

    const queueVoice = <VoiceChannel>guild.channels.cache.find(channel => channel.name === track && channel.type === "voice");
    const queueChannel = <TextChannel>callChannel?.parent?.children.find(channel => channel.name === track?.replace(/ +/g, '-').toLocaleLowerCase() + "-queue");
    let callMembers = callChannel?.members;
    console.log(callMembers?.size)
    if (queueVoice && queueChannel && callMembers) {
      if (callMembers?.size < 2) {
        return message.say("You are already alone in this call.");
      }
      callMembers?.filter(member => member.id != mentor?.id).forEach(member => {
        member.voice.setChannel(null);
      })
      return message.say("Your call is now cleared.");
    }
    return message.say("You must be in a Mentor/Mentee call room.");
  }
}

export default MentorKickCommand;
