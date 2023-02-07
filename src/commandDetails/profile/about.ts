import { CodeyUserError } from './../../codeyUserError';
import { getUserProfileById, prettyProfileDetails, UserProfile } from './../../components/profile';
import { container } from '@sapphire/framework';
import { User, MessageEmbed } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';
import { getCoinBalanceByUserId } from '../../components/coin';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const profileAboutExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const user = <User>args['user'];
  if (!user) {
    throw new Error('please enter a valid user mention or ID for balance adjustment.');
  }

  // get user profile if exists
  const profileDetails: UserProfile | undefined = await getUserProfileById(user.id);
  if (!profileDetails) {
    throw new CodeyUserError(messageFromUser, `${user.username} has not set up their profile!`);
  } else {
    // fields that are fetched that we do not want to display to the user, or want to display later (last_updated)
    const notDisplay = ['user_id', 'last_updated'];
    const profileDisplay = new MessageEmbed().setTitle(`${user.username}'s profile`);
    // setting profile colour might not be useful, but we should leave it to a separate discussion/ticket
    profileDisplay.setColor(DEFAULT_EMBED_COLOUR);
    if (user.avatar) {
      profileDisplay.setImage(
        user.displayAvatarURL({
          dynamic: true,
          format: 'png',
          size: 4096,
        }),
      );
    }
    for (const [key, val] of Object.entries(profileDetails)) {
      if (val && !notDisplay.includes(key)) {
        // iterate through each of the configurations, prettyProfileDetails making the configuration more readable
        // as opposed to snake case
        // need to cast val to string since addField does not take in numbers
        profileDisplay.addField(
          prettyProfileDetails[key as keyof typeof prettyProfileDetails],
          val.toString(),
          key !== 'about_me', // since about_me can be long, we dont want to inline it
        );
      }
    }
    // add Codey coins onto the fields as well
    const userCoins = (await getCoinBalanceByUserId(user.id))!.toString();
    profileDisplay.addField('Codey Coins', userCoins, true);
    // display last updated last
    if (profileDetails['last_updated']) {
      profileDisplay.addField(
        prettyProfileDetails.last_updated,
        profileDetails['last_updated'],
        true,
      );
    }
    return { embeds: [profileDisplay] };
  }
};

export const profileAboutComamndDetails: CodeyCommandDetails = {
  name: 'about',
  aliases: ['userprofile', 'aboutme'],
  description: 'Handle user profile functions.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}profile @Codey\``,

  isCommandResponseEphemeral: false,
  executeCommand: profileAboutExecuteCommand,
  options: [
    {
      name: 'user',
      description: 'The user to give profile of.',
      type: CodeyCommandOptionType.USER,
      required: false,
    },
  ],
  subcommandDetails: {},
};
