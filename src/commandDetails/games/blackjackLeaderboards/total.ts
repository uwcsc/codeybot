import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage,
} from '../../../codeyCommand';
import { getCoinEmoji } from '../../../components/emojis';
import { getLeaderboardEmbed } from '../../../utils/leaderboards';
import {
  getNetTotalBlackjackBalanceByUserId,
  getBlackjackNetTotalLeaderboard,
} from '../../../components/games/blackjackLeaderboards';

const blackjackNetTotalLeaderboardExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const userId = getUserFromMessage(messageFromUser).id;
  const leaderboardEmbed = await getLeaderboardEmbed(
    client,
    userId,
    getBlackjackNetTotalLeaderboard,
    (entry, rank) => {
      const netGainLoss = entry.net_gain_loss ?? 0;
      const formattedNetGainLoss = netGainLoss < 0 ? `(${netGainLoss})` : netGainLoss.toString();
      return `${rank}\\. <@${entry.user_id}> - ${formattedNetGainLoss} coins`;
    },
    async (id) => {
      const netGainLoss = await getNetTotalBlackjackBalanceByUserId(id);
      return netGainLoss < 0 ? `(${netGainLoss})` : netGainLoss.toString();
    },
    'Blackjack Net Total Leaderboard',
    getCoinEmoji(),
  );
  return { embeds: [leaderboardEmbed] };
};

export const blackjackTotalLeaderboardCommandDetails: CodeyCommandDetails = {
  name: 'total',
  aliases: ['t'],
  description: 'Get the current blackjack net gain/loss leaderboard.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}blackjackleaderboards total\`
\`${container.botPrefix}blackjackleaderboards t\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting the current blackjack net gain/loss leaderboard...',
  executeCommand: blackjackNetTotalLeaderboardExecuteCommand,
  options: [],
  subcommandDetails: {},
};
