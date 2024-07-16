import { EmbedBuilder, Emoji } from 'discord.js';
import { SapphireClient } from '@sapphire/framework';
import { DEFAULT_EMBED_COLOUR } from '../utils/embeds';

const LEADERBOARD_LIMIT_DISPLAY = 10;
const LEADERBOARD_LIMIT_FETCH = LEADERBOARD_LIMIT_DISPLAY * 2;

interface LeaderboardEntry {
  user_id: string;
  balance: number;
}

type GetLeaderboardData = (limit: number, offset?: number) => Promise<LeaderboardEntry[]>;
type FormatLeaderboardEntry = (entry: LeaderboardEntry, rank: number) => string;
type GetUserBalance = (userId: string) => Promise<number>;

const getLeaderboardEmbed = async (
  client: SapphireClient<boolean>,
  userId: string,
  getLeaderboardData: GetLeaderboardData,
  formatLeaderboardEntry: FormatLeaderboardEntry,
  getUserBalance: GetUserBalance,
  leaderboardTitle: string,
  leaderboardEmoji: string | Emoji,
): Promise<EmbedBuilder> => {
  let leaderboard = await getLeaderboardData(LEADERBOARD_LIMIT_FETCH);
  const leaderboardArray: string[] = [];
  const userBalance = await getUserBalance(userId);
  let previousBalance = -1;
  let position = 0;
  let rank = 0;
  let offset = 0;
  let i = 0;
  let absoluteCount = 0;

  while (leaderboardArray.length < LEADERBOARD_LIMIT_DISPLAY || position === 0) {
    if (i === LEADERBOARD_LIMIT_FETCH) {
      offset += LEADERBOARD_LIMIT_FETCH;
      leaderboard = await getLeaderboardData(LEADERBOARD_LIMIT_FETCH, offset);
      i = 0;
    }
    if (i >= leaderboard.length) {
      break;
    }
    const entry = leaderboard[i++];
    const user = await client.users.fetch(entry.user_id).catch(() => null);
    if (user?.bot) continue;
    if (previousBalance === entry.balance) {
      previousBalance = entry.balance;
    } else {
      previousBalance = entry.balance;
      rank = absoluteCount + 1;
    }
    absoluteCount++;
    if (entry.user_id === userId) {
      position = rank;
    }
    if (leaderboardArray.length < LEADERBOARD_LIMIT_DISPLAY) {
      leaderboardArray.push(formatLeaderboardEntry(entry, rank));
    }
  }
  const leaderboardText = leaderboardArray.join('\n');
  const leaderboardEmbed = new EmbedBuilder()
    .setColor(DEFAULT_EMBED_COLOUR)
    .setTitle(leaderboardTitle)
    .setDescription(leaderboardText);
  leaderboardEmbed.addFields([
    {
      name: 'Your Position',
      value: `You are currently **#${position}** in the leaderboard with ${userBalance} ${leaderboardEmoji}.`,
    },
  ]);
  return leaderboardEmbed;
};

export { getLeaderboardEmbed };
