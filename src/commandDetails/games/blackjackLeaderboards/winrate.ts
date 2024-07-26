import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage,
} from '../../../codeyCommand';
import { getLeaderboardEmbed } from '../../../utils/leaderboards';
import { getWinrateBlackjackByUserId, getBlackjackWinrateLeaderboard } from '../../../components/games/blackjackLeaderboards';

const blackjackWinrateLeaderboardExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const userId = getUserFromMessage(messageFromUser).id;
  const leaderboardEmbed = await getLeaderboardEmbed(
    client,
    userId,
    getBlackjackWinrateLeaderboard,
    (entry, rank) => {
      const formattedWinrate = entry.winrate ? (entry.winrate * 100).toFixed(2) + ' %' : 'N/A';
      return `${rank}\\. <@${entry.user_id}> - ${formattedWinrate}`
    },
    async (id) => {
      const winrate = await getWinrateBlackjackByUserId(id);
      return winrate ? (winrate * 100).toFixed(2) + ' %' : 'N/A';
    },
    'Blackjack Winrate Leaderboard',
    '',
  );
  return { embeds: [leaderboardEmbed] };
};

export const blackjackWinrateLeaderboardCommandDetails: CodeyCommandDetails = {
  name: 'winrate',
  aliases: ['wr'],
  description: 'Get the current blackjack winrate leaderboard.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}blackjackleaderboards winrate\`
\`${container.botPrefix}blackjackleaderboards wr\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting the current blackjack winrate leaderboard...',
  executeCommand: blackjackWinrateLeaderboardExecuteCommand,
  options: [],
  subcommandDetails: {},
};
