import { container, SapphireClient } from '@sapphire/framework';
import { MessageEmbed, User } from 'discord.js';
import {
  CodeyCommandDetails,
  getUserFromMessage,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import {
  getCurrentCoinLeaderboard,
  getCoinBalanceByUserId,
  UserCoinEntry,
  getUserIdCurrentCoinPosition,
} from '../../components/coin';
import { getCoinEmoji } from '../../components/emojis';
import { EMBED_COLOUR } from '../../utils/embeds';

// How many people are shown on the leaderboard
const limit = 10;

const getCurrentCoinLeaderboardEmbed = async (
  client: SapphireClient<boolean>,
  leaderboard: UserCoinEntry[],
  currentUserId: string,
): Promise<MessageEmbed> => {
  // Initialise user's coin balance if they have not already
  const userBalance = await getCoinBalanceByUserId(currentUserId);
  const currentPosition = await getUserIdCurrentCoinPosition(currentUserId);

  const leaderboardArray: string[] = [];
  for (let i = 0; i < leaderboard.length && leaderboardArray.length < limit; i++) {
    const userCoinEntry = leaderboard[i];
    let user: User;
    try {
      user = await client.users.fetch(userCoinEntry.user_id);
    } catch (e) {
      continue;
    }
    if (user.bot) continue;
    const userTag = user?.tag ?? '<unknown>';
    const userCoinEntryText = `${leaderboardArray.length + 1}. ${'``'}${userTag}${'``'} - ${
      userCoinEntry.balance
    } ${getCoinEmoji()}`;
    leaderboardArray.push(userCoinEntryText);
  }
  const currentLeaderboardText = leaderboardArray.join('\n');
  const currentLeaderboardEmbed = new MessageEmbed()
    .setColor(EMBED_COLOUR)
    .setTitle('CodeyCoin Leaderboard')
    .setDescription(currentLeaderboardText);

  currentLeaderboardEmbed.addFields({
    name: 'Your Position',
    value: `You are currently **#${currentPosition}** in the leaderboard with ${userBalance} ${getCoinEmoji()}.`,
  });

  return currentLeaderboardEmbed;
};

const coinCurrentLeaderboardExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const userId = getUserFromMessage(messageFromUser).id;
  // Get extra users to filter bots later
  const leaderboard = await getCurrentCoinLeaderboard(limit * 2);
  return { embeds: [await getCurrentCoinLeaderboardEmbed(client, leaderboard, userId)] };
};

export const coinCurrentLeaderboardCommandDetails: CodeyCommandDetails = {
  name: 'leaderboard',
  aliases: ['lb'],
  description: 'Get the current coin leaderboard.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}coin lb\`
\`${container.botPrefix}coin leaderboard\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting the current coin leaderboard...',
  executeCommand: coinCurrentLeaderboardExecuteCommand,
  options: [],
  subcommandDetails: {},
};
