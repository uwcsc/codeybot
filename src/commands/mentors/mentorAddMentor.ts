import { Message, CategoryChannel, Permissions, TextChannel } from 'discord.js';
import { CommandoClient, CommandoGuild, CommandoMessage } from 'discord.js-commando';
import { AdminCommand } from '../../utils/commands';
import { mentorRole } from '../../bot';

class MentorAddMentorCommand extends AdminCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'add-mentor',
      group: 'mentor',
      memberName: 'add-mentor',
      args: [
        {
          key: 'mentorHandle',
          prompt: 'What is the discord handle/ID of the mentor?',
          type: 'string'
        }
      ],
      description: 'Adds an  to the server for Mentors.',
      examples: [`${client.commandPrefix}mentor I want a new Discord channel named #hobbies!`]
    });
  }

  async onRun(message: CommandoMessage, args: { mentorHandle: string }): Promise<Message> {
    let { mentorHandle } = args;

    const mentorIdsHandles = <TextChannel>message.guild.channels.cache.find(channel => channel.name === "mentor-ids");
    mentorIdsHandles.send(mentorHandle);

    message.guild.members.cache.find(user => user.user.tag == mentorHandle || user.id == mentorHandle)?.edit({
      roles: [mentorRole]
    });

    return message.say("Mentor added.");
  }
}

export default MentorAddMentorCommand;
