import { container, SapphireClient } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import {
  CodeyCommandDetails,
  getUserFromMessage,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { getCoinBalanceByUserId, getCoinLeaderboard } from '../../components/coin';
import { getCoinEmoji } from '../../components/emojis';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds';

// Number of users to display on leaderboard
const LEADERBOARD_LIMIT_DISPLAY = 10;
// Number of users to fetch for leaderboard
const LEADERBOARD_LIMIT_FETCH = LEADERBOARD_LIMIT_DISPLAY * 2;

const getCoinLeaderboardEmbed = async (
  client: SapphireClient<boolean>,
  userId: string,
): Promise<EmbedBuilder> => {
  // Get extra users to filter bots later
  let leaderboard = await getCoinLeaderboard(LEADERBOARD_LIMIT_FETCH);
  const leaderboardArray: string[] = [];
  // Initialize user's coin balance if they have not already
  const userBalance = await getCoinBalanceByUserId(userId);
  let previousBalance = -1;
  let position = 0;
  let rank = 0;
  let offset = 0;
  let i = 0;
  let absoluteCount = 0;
  while (leaderboardArray.length < LEADERBOARD_LIMIT_DISPLAY || position === 0) {
    if (i === LEADERBOARD_LIMIT_FETCH) {
      offset += LEADERBOARD_LIMIT_FETCH;
      leaderboard = await getCoinLeaderboard(LEADERBOARD_LIMIT_FETCH, offset);
      i = 0;
    }
    if (i >= leaderboard.length) {
      break;
    }
    const userCoinEntry = leaderboard[i++];
    const user = await client.users.fetch(userCoinEntry.user_id).catch(() => null);
    if (user?.bot) continue;
    if (previousBalance === userCoinEntry.balance) {
      previousBalance = userCoinEntry.balance;
      // rank does not change
    } else {
      previousBalance = userCoinEntry.balance;
      rank = absoluteCount + 1;
    }
    // count how many total users have been processed:
    absoluteCount++;
    if (userCoinEntry.user_id === userId) {
      position = rank;
    }
    if (leaderboardArray.length < LEADERBOARD_LIMIT_DISPLAY) {
      const userCoinEntryText = `${rank}\\. <@${userCoinEntry.user_id}> - ${
        userCoinEntry.balance
      } ${getCoinEmoji()}`;
      leaderboardArray.push(userCoinEntryText);
    }
  }
  const leaderboardText = leaderboardArray.join('\n');
  const leaderboardEmbed = new EmbedBuilder()
    .setColor(DEFAULT_EMBED_COLOUR)
    .setTitle('Codey Coin Leaderboard')
    .setDescription(leaderboardText);
  leaderboardEmbed.addFields([
    {
      name: 'Your Position',
      value: `You are currently **#${position}** in the leaderboard with ${userBalance} ${getCoinEmoji()}.`,
    },
  ]);
  return leaderboardEmbed;
};

const coinLeaderboardExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const userId = getUserFromMessage(messageFromUser).id;
  return { embeds: [await getCoinLeaderboardEmbed(client, userId)] };
};

export const coinLeaderboardCommandDetails: CodeyCommandDetails = {
  name: 'leaderboard',
  aliases: ['lb'],
  description: 'Get the current coin leaderboard.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}coin lb\`
\`${container.botPrefix}coin leaderboard\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting the current coin leaderboard...',
  executeCommand: coinLeaderboardExecuteCommand,
  options: [],
  subcommandDetails: {},
};
