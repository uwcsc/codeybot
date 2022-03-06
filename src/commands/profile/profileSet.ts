import { Message } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { editUserProfileById, UserProfile, validUserCustomization, configMaps } from '../../components/profile';
import { BaseCommand } from '../../utils/commands';

class UserProfileSetCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'profile-set',
      aliases: ['setp'],
      group: 'profile',
      memberName: 'set',
      description: `Set your user profile.`,
      args: [
        {
          key: 'customization',
          prompt: `enter one of **${(Object.keys(configMaps) as Array<keyof typeof configMaps>).map(
            (key) => ' ' + key
          )}**`,
          type: 'string'
        },
        {
          key: 'description',
          prompt: `What would you like to set it as?`,
          type: 'string'
        }
      ],
      examples: [`${client.commandPrefix}profile-set`, `${client.commandPrefix}setp`]
    });
  }

  async onRun(
    message: CommandoMessage,
    args: { customization: keyof typeof configMaps; description: string }
  ): Promise<Message> {
    const { author } = message;
    const { customization, description } = args;
    const { reason, parsedDescription } = validUserCustomization(customization, description);
    if (reason == 'valid') {
      editUserProfileById(author.id, { [configMaps[customization]]: parsedDescription } as UserProfile);
      return message.reply(`${customization} has been set!`);
    }
    const messagePrefix = 'Invalid description, please try again. Reason: ';
    return message.reply(messagePrefix + reason);
  }
}

export default UserProfileSetCommand;
