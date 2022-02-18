import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import _ from 'lodash';
import { editUserProfileById, UserProfile, configMaps } from '../../components/profile';
import { BaseCommand } from '../../utils/commands';


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

  async onRun(message: CommandoMessage, args: {customization: keyof typeof configMaps, description: string}): Promise<Message> {
    const { author } = message;
    let { customization } = args;
    const { description } = args;

    editUserProfileById(author.id, {[configMaps[customization]]: description} as UserProfile)  
    return message.reply(`${customization} has been set!`);
  }
}

export default UserProfileAboutCommand;