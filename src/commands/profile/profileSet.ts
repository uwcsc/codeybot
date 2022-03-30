import { Message } from 'discord.js';
import { Args, Command, CommandOptions } from '@sapphire/framework'
import { ApplyOptions } from '@sapphire/decorators'
import { editUserProfileById, UserProfile, validUserCustomization, configMaps } from '../../components/profile';
import { BOT_PREFIX } from '../../bot';

@ApplyOptions<CommandOptions>({
  aliases: ['setp'],
  description: 'Set your user profile.',
  detailedDescription: `**Examples**\n\`${BOT_PREFIX}profile-set\`\n\`${BOT_PREFIX}setp\``
})
export class UserProfileSetCommand extends Command {
  async messageRun(
    message: Message,
    args: Args
  ): Promise<Message> {
    const { author } = message;
    const customization = <keyof typeof configMaps> await args.pick('string').catch(() => `please enter a valid customization. `)
    const description = await args.rest('string').catch(() => false)
    if (typeof description === 'boolean'){
      return message.reply("Please enter a description.")
    }
    const { reason, parsedDescription } = validUserCustomization(customization, description);
    if (reason == 'valid') {
      editUserProfileById(author.id, { [configMaps[customization]]: parsedDescription } as UserProfile);
      return message.reply(`${customization} has been set!`);
    }
    const messagePrefix = 'Invalid arguments, please try again. Reason: ';
    return message.reply(messagePrefix + reason);
  }
}

