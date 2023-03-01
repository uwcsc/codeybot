import { CodeyUserError } from '../../codeyUserError';
import { getUserProfileById, prettyProfileDetails, UserProfile } from '../../components/profile';
import { container } from '@sapphire/framework';
import { User, MessageEmbed } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage,
} from '../../codeyCommand';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';
import { getCoinBalanceByUserId } from '../../components/coin';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const profileAboutExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  let user = <User>args['user'];
  if (!user) {
    user = getUserFromMessage(messageFromUser);
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
        profileDisplay.addFields({
          name: prettyProfileDetails[key as keyof typeof prettyProfileDetails],
          value: val.toString(),
          inline: key !== 'about_me', // since about_me can be long, we dont want to inline it
        });
      }
    }
    // add Codey coins onto the fields as well
    const userCoins = (await getCoinBalanceByUserId(user.id))!.toString();
    profileDisplay.addFields({ name: 'Codey Coins', value: userCoins, inline: true });
    // display last updated last
    if (profileDetails['last_updated']) {
      profileDisplay.addFields({
        name: prettyProfileDetails.last_updated,
        value: profileDetails['last_updated'],
        inline: true,
      });
    }
    return { embeds: [profileDisplay] };
  }
};

export const profileAboutCommandDetails: CodeyCommandDetails = {
  name: 'about',
  aliases: ['a'],
  description: 'Display user profile.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}profile about @Codey\`
  \`${container.botPrefix}profile a @Codey\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: "Getting user's profile...",
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
