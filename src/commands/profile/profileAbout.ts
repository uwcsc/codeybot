import { Message, MessageEmbed, User } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import _ from 'lodash';
import { UserProfile, getUserProfileById } from '../../components/profile';
import { BaseCommand } from '../../utils/commands';

enum prettyProfileDetails {
  about_me = "About Me",
  birth_date = "Birth Date",
  preferred_name = "Preferred Name",
  preferred_pronouns = "Preferred Pronouns",
  term = "Term",
  year = "Year",
  major = "Major",
  program = "Program"
}

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
      const notDisplay = ["user_id", "last_updated"]
      const profileDisplay = new MessageEmbed().setTitle(`${user.username}'s profile`)
      profileDisplay.setColor('GREEN') // maybe user should be able to set their colour?
      if (user.avatar){
        profileDisplay.setImage(user.displayAvatarURL())
      }
      for (const [key, val] of Object.entries(profileDetails)){
        if (val && !notDisplay.includes(key) ){
          profileDisplay.addField(prettyProfileDetails[key as keyof typeof prettyProfileDetails], val)
        }
      }
      return message.channel.send(profileDisplay);
    }

  }
}

export default UserProfileAboutCommand;