import { Message, User } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import _ from 'lodash';
import { UserProfile, getUserProfileById } from '../../components/profile';
import { BaseCommand } from '../../utils/commands';
import { getDomains, getDomainsString, getInterviewer } from '../../components/interview';
import { EMBED_COLOUR } from '../../utils/embeds';

class UserProfileAboutCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'about',
      aliases: ['userabout'],
      group: 'userprofiles',
      memberName: 'userprofile',
      description: 'Shows the user profile',
      examples: [`${client.commandPrefix}about @Codey`, `${client.commandPrefix}userabout @Codey`],
      args: [
        {
          key: 'user',
          prompt: 'tag the user you want to check.',
          type: 'user'
        }
      ]
    });
  }

  async onRun(message: CommandoMessage, args: { user: User} ): Promise<Message> {
    const { user } = args;
    const profileDetails: UserProfile | undefined = await getUserProfileById(user.id);
    if (!profileDetails){
      return message.reply(`${user.username} has not set up their profile!`)
    } else {
      return message.channel.send("here the profile");
    }

  }
}

export default UserProfileAboutCommand;