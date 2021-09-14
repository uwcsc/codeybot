import { Message, VoiceChannel, TextChannel } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { MentorCommand } from '../../utils/commands';
import { BootcampSettings } from '../../components/bootcamp';

class BootcampNextCommand extends MentorCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'next',
      aliases: ['mentee'],
      group: 'bootcamp',
      memberName: 'next',
      guildOnly: true,
      description: 'Moves the next mentee in line to your call.'
    });
  }

  async onRun(message: CommandoMessage): Promise<Message> {
    const mentor = message.member?.voice;
    const callChannel = mentor?.channel;
    const guild = message.guild;
    const track = callChannel?.parent?.name;

    let front;

    const queueVoice = <VoiceChannel>(
      guild.channels.cache.find((channel) => channel.name === track && channel.type === 'voice')
    );
    const queueChannel = <TextChannel>(
      callChannel?.parent?.children.find(
        (channel) => channel.name === track?.replace(/ +/g, '-').toLocaleLowerCase() + '-queue'
      )
    );
    const queueMembers = queueVoice?.members;

    if (queueVoice && queueChannel) {
      if (callChannel?.full) {
        return message.say('You should only have one Mentee at a time.');
      }
      if (queueMembers.size < 1) {
        return message.say('The are no Mentees waiting for this track.');
      }

      queueChannel.messages.fetch({ limit: queueVoice.members.size * 2 + 5 }).then((messages) => {
        messages
          .sorted((mesgA, mesgB) => mesgA.createdTimestamp - mesgB.createdTimestamp)
          .every((msg): boolean => {
            front = queueMembers.get(msg.content);
            if (front) {
              const mentorCall = <VoiceChannel>mentor?.channel;
              front.voice.setChannel(mentorCall);
              message.say('please welcome ' + front.displayName + '!');
              const chatChannel = <TextChannel>(
                mentorCall?.parent?.children.find(
                  (channel) => channel.name === mentorCall?.name.replace(/ +/g, '-').toLocaleLowerCase() + '-vc'
                )
              );
              chatChannel
                .updateOverwrite(front, {
                  VIEW_CHANNEL: true
                })
                .then(async () => {
                  const critiqueTime = (await BootcampSettings?.get('critique_time')) || 30;
                  chatChannel.send('You have **' + critiqueTime + '** minutes remaining.');
                });
              return false;
            }
            return true;
          });
      });
      const critiqueTime = (await BootcampSettings?.get('critique_time')) || 30;
      return message.say('Your **' + critiqueTime + '** minute call has started!');
    } else {
      return message.say('You must be in a Mentor/Mentee call room.');
    }
  }
}

export default BootcampNextCommand;
