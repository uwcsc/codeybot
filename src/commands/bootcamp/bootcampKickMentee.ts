import { Message, VoiceChannel, TextChannel } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { MentorCommand } from '../../utils/commands';

class BootcampKickMenteeCommand extends MentorCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'kick',
      aliases: ['remove', 'boot'],
      group: 'bootcamp',
      memberName: 'kick',
      guildOnly: true,
      description: 'Kick mentees out of your 1 on 1 call.'
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    const mentor = message.member;
    const callChannel = mentor?.voice?.channel;
    const guild = message.guild;
    const track = callChannel?.parent?.name;

    const queueVoice = <VoiceChannel>(
      guild.channels.cache.find((channel) => channel.name === track && channel.type === 'voice')
    );
    const queueChannel = <TextChannel>(
      callChannel?.parent?.children.find(
        (channel) => channel.name === track?.replace(/ +/g, '-').toLocaleLowerCase() + '-queue'
      )
    );
    const callMembers = callChannel?.members;

    if (queueVoice && queueChannel && callMembers) {
      if (callMembers?.size < 2) {
        return message.say('You are already alone in this call.');
      }
      callMembers
        ?.filter((member) => member.id != mentor?.id)
        .forEach((member) => {
          member.voice.setChannel(null);
        });
      return message.say('Your call is now cleared.');
    }
    return message.say('You must be in a Mentor/Mentee call room.');
  }
}

export default BootcampKickMenteeCommand;
