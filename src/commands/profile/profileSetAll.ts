import { Message, User } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import _ from 'lodash';
import { editUserProfileById, UserProfile,  } from '../../components/profile';
import { BaseCommand } from '../../utils/commands';
import { getDomains, getDomainsString, getInterviewer } from '../../components/interview';
import { EMBED_COLOUR } from '../../utils/embeds';

enum configMaps {
  aboutme = "about_me",
  birthdate = "birth_date",
  preferredname = "preferred_name",
  preferredpronouns = "preferred_pronouns",
  term = "term",
  year = "year",
  major = "major",
  program = "program"
}
class UserProfileAboutCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'setprofile',
      aliases: ['setp'],
      group: 'userprofiles',
      memberName: 'setprofile',
      description: 'Set your user profile',
      args: [
        {
          key: 'customization',
          prompt: `enter one of **${(Object.keys(configMaps) as Array<keyof typeof configMaps>).map(key => " " + key)}**`,
          type: 'string'
        },
        {
          key: 'description',
          prompt: `What would you like to set it as?`,
          type: 'string'
        }
      ],
      examples: [`${client.commandPrefix}setprofile`, `${client.commandPrefix}setp`],
    });
  }

  async onRun(message: CommandoMessage, args: {customization: configMaps, description: string}): Promise<null> {
    const { author } = message;
    let {customization} = args;
    const { description } = args;
    // customization = configMaps[customization];
    // I want customization to be able to be passed in as the key here
    editUserProfileById(author.id, {"about_me": description})  
    return null;
    // const profileDetails: UserProfile | undefined = await getUserProfileById(user.id);
    // if (!profileDetails){
    //   return message.reply(`${user.username} has not set up their profile!`)
    // } else {
    //   return message.channel.send("here the profile");
    // }

  }
}

export default UserProfileAboutCommand;