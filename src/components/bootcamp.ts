import { GuildMember, Role, TextChannel, Message, GuildChannel, VoiceState } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
const Keyv = require('keyv');

const BOOTCAMP_GUILD_ID: string = process.env.BOOTCAMP_GUILD_ID || '.';
export const BootcampSettings = new Keyv();

export const initBootcamp = async (client: CommandoClient): Promise<void> => {
  const bootcamp = await client.guilds.fetch(BOOTCAMP_GUILD_ID);
  const mentorGetRole = <Role>bootcamp.roles.cache.find((role) => role.name === 'Mentor');
  BootcampSettings.set('mentor_role', mentorGetRole.id);
  BootcampSettings.set('critique_time', 30);
};

export const addToMentorList = async (message: Message): Promise<void> => {
  if ((<TextChannel>message.channel).name === 'mentor-ids') {
    const mentorRole = await BootcampSettings.get('mentor_role');
    message?.guild?.members.cache
      .find((member: GuildMember) => member.user.tag == message.content || member.id == message.content)
      ?.edit({
        roles: [mentorRole]
      });
  }
};

export const checkIfMentor = async (member: GuildMember): Promise<void> => {
  const mentorIdsHandles = <TextChannel>member.guild.channels.cache.find((channel) => channel.name === 'mentor-ids');
  const mentorRole = await BootcampSettings.get('mentor_role');
  mentorIdsHandles?.messages.fetch({ limit: 100 }).then((messages) => {
    messages.forEach((mesg): void => {
      const checkList = mesg.content.split('\n').map((str) => str.trim());
      if (checkList.includes(member.id) || checkList.includes(member.user.tag)) {
        member
          .edit({
            roles: [mentorRole]
          })
          .catch(console.log);
      }
    });
  });
};

export const controlMentorMenteeCalls = async (oldMember: VoiceState, newMember: VoiceState): Promise<void> => {
  const guild = oldMember.guild;
  const newUserChannel = newMember.channel;
  const oldUserChannel = oldMember.channel;

  if (newUserChannel === oldUserChannel) return;

  if (newUserChannel !== null) {
    const queueChannel = <TextChannel>(
      guild.channels.cache
        .filter((channel) => channel.name === newUserChannel?.name.replace(/ +/g, '-').toLocaleLowerCase() + '-queue')
        .first()
    );
    queueChannel?.send(newMember.id);
  }

  if (oldUserChannel !== null) {
    const chatChannel = <TextChannel>(
      oldUserChannel?.parent?.children.find(
        (channel: GuildChannel) => channel.name === oldUserChannel?.name.replace(/ +/g, '-').toLocaleLowerCase() + '-vc'
      )
    );
    const leaver = <GuildMember>oldMember.member;

    if (chatChannel) {
      const mentorRole = await BootcampSettings.get('mentor_role');
      if (leaver.roles.cache.map((role) => role.id).includes(mentorRole)) {
        if (
          oldUserChannel.members.filter((member: GuildMember) =>
            member.roles.cache.map((role) => role.id).includes(mentorRole)
          ).size === 0
        ) {
          try {
            chatChannel.delete();
            oldUserChannel.delete();
          } catch (error) {
            console.log('Channel already deleted');
          }
        }
      } else {
        (async (): Promise<void> => {
          const fetched = await chatChannel.messages.fetch({ limit: 100 }).catch(console.log);
          if (fetched) chatChannel.bulkDelete(fetched);
        })();
      }
      chatChannel?.updateOverwrite(leaver, {
        VIEW_CHANNEL: false
      });
    }

    const queueChannel = <TextChannel>(
      guild.channels.cache
        .filter(
          (channel: GuildChannel) =>
            channel.name === oldUserChannel?.name.replace(/ +/g, '-').toLocaleLowerCase() + '-queue'
        )
        .first()
    );
    const clear = async (): Promise<void> => {
      const fetched = await queueChannel.messages.fetch({ limit: 100 }).catch(console.log);
      if (fetched) {
        const filtered = fetched.filter((msg) => msg.content === newMember.id);
        queueChannel.bulkDelete(filtered);
      }
    };
    if (queueChannel) clear();
  }
};
