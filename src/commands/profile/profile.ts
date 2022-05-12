import { ApplyOptions } from '@sapphire/decorators';
import { Args, container } from '@sapphire/framework';
import { SubCommandPluginCommand, SubCommandPluginCommandOptions } from '@sapphire/plugin-subcommands';
import { Message, MessageEmbed } from 'discord.js';
import { getCoinBalanceByUserId } from '../../components/coin';
import {
  configMaps,
  editUserProfileById,
  getUserProfileById,
  UserProfile,
  validCustomizations,
  validCustomizationsDisplay,
  validUserCustomization,
  prettyProfileDetails
} from '../../components/profile';
import { EMBED_COLOUR } from '../../utils/embeds';

@ApplyOptions<SubCommandPluginCommandOptions>({
  aliases: ['profile', 'userprofile', 'aboutme'],
  description: 'Handles user profile functions',
  detailedDescription: `**Examples:**
\`${container.botPrefix}profile @Codey\``,
  subCommands: [{ input: 'about', default: true }, 'set']
})
export class ProfileCommand extends SubCommandPluginCommand {
  public async about(message: Message, args: Args): Promise<Message> {
    const user = await args.rest('user').catch(() => 'please enter a valid user mention or ID to check their profile.');
    if (typeof user === 'string') return message.reply(user);
    // get user profile if exists
    const profileDetails: UserProfile | undefined = await getUserProfileById(user.id);
    if (!profileDetails) {
      return message.reply(`${user.username} has not set up their profile!`);
    } else {
      // fields that are fetched that we do not want to display to the user, or want to display later (last_updated)
      const notDisplay = ['user_id', 'last_updated'];
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
          profileDisplay.addField(
            prettyProfileDetails[key as keyof typeof prettyProfileDetails],
            val.toString(),
            key !== 'about_me' // since about_me can be long, we dont want to inline it
          );
        }
      }
      // add codeycoins onto the fields as well
      const userCoins = (await getCoinBalanceByUserId(user.id)).toString();
      profileDisplay.addField('Codey Coins', userCoins, true);
      // display last updated last
      if (profileDetails['last_updated']) {
        profileDisplay.addField(prettyProfileDetails.last_updated, profileDetails['last_updated'], true);
      }
      return message.channel.send({ embeds: [profileDisplay] });
    }
  }

  public async set(message: Message, args: Args): Promise<Message> {
    const { author } = message;
    const customization = <keyof typeof configMaps>await args.pick('string').catch(() => false);
    // if no customization is supplied, or its not one of the customizations we provide, return
    if (typeof customization === 'boolean' || !validCustomizations.includes(customization)) {
      return message.reply(`Please enter a customization. Must be one of**${validCustomizationsDisplay}**`);
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
    // if reason is not valid the reason will be returned by the validUserCustomization function
    const messagePrefix = 'Invalid arguments, please try again. Reason: ';
    return message.reply(messagePrefix + reason);
  }
}
