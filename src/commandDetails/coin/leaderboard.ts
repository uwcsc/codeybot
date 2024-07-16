import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage,
} from '../../codeyCommand';
import { getCoinBalanceByUserId, getCoinLeaderboard } from '../../components/coin';
import { getCoinEmoji } from '../../components/emojis';
import { getLeaderboardEmbed } from '../../utils/leaderboards';

const coinLeaderboardExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const userId = getUserFromMessage(messageFromUser).id;
  const leaderboardEmbed = await getLeaderboardEmbed(
    client,
    userId,
    getCoinLeaderboard,
    (entry, rank) => `${rank}\\. <@${entry.user_id}> - ${entry.balance} ${getCoinEmoji()}`,
    getCoinBalanceByUserId,
    'Codey Coin Leaderboard',
    getCoinEmoji(),
  );
  return { embeds: [leaderboardEmbed] };
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
