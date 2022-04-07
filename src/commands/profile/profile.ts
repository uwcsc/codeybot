import { SubCommandPluginCommand, SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { Message, MessageEmbed } from 'discord.js';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import {
  UserProfile,
  getUserProfileById,
  editUserProfileById,
  validUserCustomization,
  validCustomizations,
  configMaps
} from '../../components/profile';
import { getCoinBalanceByUserId } from '../../components/coin';
import { BOT_PREFIX } from '../../bot';
import { EMBED_COLOUR } from '../../utils/embeds';

@ApplyOptions<SubCommandPluginCommandOptions>({
  aliases: ['profile'],
  description: 'Handles user profile functions',
  detailedDescription: `**Examples:**\n\`${BOT_PREFIX}profile @Codey\``,
  subCommands: ['about', 'set', { input: 'list', default: true }]
})
export class ProfileCommand extends SubCommandPluginCommand {
  public async about(message: Message, args: Args): Promise<Message> {
    enum prettyProfileDetails {
      about_me = 'About Me',
      birth_date = 'Birth Date',
      preferred_name = 'Preferred Name',
      preferred_pronouns = 'Preferred Pronouns',
      term = 'Term',
      year = 'Year',
      faculty = 'Faculty',
      program = 'Program',
      specialization = 'Specialization',
      last_updated = 'Last Updated'
    }
    const user = await args.rest('user').catch(() => 'please enter a valid user mention or ID to check their profile.');
    if (typeof user === 'string') return message.reply(user);
    // get user profile if exists
    const profileDetails: UserProfile | undefined = await getUserProfileById(user.id);
    if (!profileDetails) {
      return message.reply(`${user.username} has not set up their profile!`);
    } else {
      // fields that are fetched that we do not want to display to the user
      const notDisplay = ['user_id'];
      const profileDisplay = new MessageEmbed().setTitle(`${user.username}'s profile`);
      // setting profile colour might not be useful, but we should leave it to a separate discussion/ticket
      profileDisplay.setColor(EMBED_COLOUR);
      if (user.avatar) {
        profileDisplay.setImage(user.displayAvatarURL());
      }
      for (const [key, val] of Object.entries(profileDetails)) {
        if (val && !notDisplay.includes(key)) {
          // iterate through each of the configurations, prettyProfileDetails making the configuration more readable
          // as opposed to snake case
          // need to cast val to string since addField does not take in numbers
          profileDisplay.addField(prettyProfileDetails[key as keyof typeof prettyProfileDetails], val.toString());
        }
      }
      // add codeycoins onto the fields as well
      const userCoins = (await getCoinBalanceByUserId(user.id)).toString();
      profileDisplay.addField('Codey Coins', userCoins);
      return message.channel.send({ embeds: [profileDisplay] });
    }
  }

  public async set(message: Message, args: Args): Promise<Message> {
    const { author } = message;
    const customization = <keyof typeof configMaps>await args.pick('string').catch(() => false);
    if (typeof customization === 'boolean') {
      return message.reply(`Please enter a customization. Must be one of**${validCustomizations}**`);
    }
    const description = await args.rest('string').catch(() => false);
    if (typeof description === 'boolean') {
      return message.reply('Please enter a description.');
    }
    const { reason, parsedDescription } = validUserCustomization(customization, description);
    if (reason === 'valid') {
      editUserProfileById(author.id, { [configMaps[customization]]: parsedDescription } as UserProfile);
      return message.reply(`${customization} has been set!`);
    }
    const messagePrefix = 'Invalid arguments, please try again. Reason: ';
    return message.reply(messagePrefix + reason);
  }
}
