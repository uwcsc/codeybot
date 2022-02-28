import { Message, MessageEmbed, User } from 'discord.js';
import { CommandoClient, CommandoMessage } from 'discord.js-commando';
import { UserProfile, getUserProfileById } from '../../components/profile';
import { getCoinBalanceByUserId } from '../../components/coin';
import { BaseCommand } from '../../utils/commands';

enum prettyProfileDetails {
  about_me = 'About Me',
  birth_date = 'Birth Date',
  preferred_name = 'Preferred Name',
  preferred_pronouns = 'Preferred Pronouns',
  term = 'Term',
  year = 'Year',
  faculty = 'Faculty',
  program = 'Program',
  last_updated = 'Last Updated'
}

class UserProfileCommand extends BaseCommand {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'profile',
      aliases: ['profile-about', 'userabout', 'aboutuser'],
      group: 'profiles',
      memberName: 'about',
      description: 'Shows the user profile',
      examples: [`${client.commandPrefix}profile-about @Codey`, `${client.commandPrefix}userabout @Codey`],
      args: [
        {
          key: 'user',
          prompt: 'tag the user you want to check.',
          type: 'user'
        }
      ]
    });
  }

  async onRun(message: CommandoMessage, args: { user: User }): Promise<Message> {
    const { user } = args;
    // get user profile if exists
    const profileDetails: UserProfile | undefined = await getUserProfileById(user.id);
    if (!profileDetails) {
      return message.reply(`${user.username} has not set up their profile!`);
    } else {
      // fields that are fetched that we do not want to display to the user
      const notDisplay = ['user_id'];
      const profileDisplay = new MessageEmbed().setTitle(`${user.username}'s profile`);
      // setting profile colour might not be useful, but we should leave it to a separate discussion/ticket
      profileDisplay.setColor('GREEN');
      if (user.avatar) {
        profileDisplay.setImage(user.displayAvatarURL());
      }
      for (const [key, val] of Object.entries(profileDetails)) {
        if (val && !notDisplay.includes(key)) {
          // iterate through each of the configurations, prettyProfileDetails making the configuration more readable
          // as opposed to snake case
          profileDisplay.addField(prettyProfileDetails[key as keyof typeof prettyProfileDetails], val);
        }
      }
      // add codeycoins onto the fields as well
      const userCoins = await getCoinBalanceByUserId(user.id);
      profileDisplay.addField('Codeycoins', userCoins);
      return message.channel.send(profileDisplay);
    }
  }
}

export default UserProfileCommand;
