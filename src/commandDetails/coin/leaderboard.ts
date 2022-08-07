import { container, SapphireClient } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandResponseType,
  getUserIdFromMessage,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';
import {
  getCurrentCoinLeaderboard,
  getCoinBalanceByUserId,
  UserCoinEntry,
  getUserIdCurrentCoinPosition
} from '../../components/coin';
import { EMBED_COLOUR } from '../../utils/embeds';

// How many people are shown on the leaderboard
const limit = 10;

const getCurrentCoinLeaderboardEmbed = async (
  client: SapphireClient<boolean>,
  leaderboard: UserCoinEntry[],
  currentUserId: string
): Promise<MessageEmbed> => {
  // Initialise user's coin balance if they have not already
  const userBalance = await getCoinBalanceByUserId(currentUserId);
  const currentPosition = await getUserIdCurrentCoinPosition(currentUserId);

  let currentLeaderboardText = '';
  for (let i = 0; i < limit; i++) {
    if (leaderboard.length <= i) break;
    const userCoinEntry = leaderboard[i];
    const user = await client.users.fetch(userCoinEntry.user_id);
    const userTag = user?.tag ?? '<unknown>';
    const userCoinEntryText = `${i + 1}. ${userTag} - ${userCoinEntry.balance} 🪙\n`;
    currentLeaderboardText += userCoinEntryText;
  }
  const currentLeaderboardEmbed = new MessageEmbed()
    .setColor(EMBED_COLOUR)
    .setTitle('CodeyCoin Leaderboard')
    .setDescription(currentLeaderboardText);

  currentLeaderboardEmbed.addFields({
    name: 'Your Position',
    value: `You are currently **#${currentPosition}** in the leaderboard with ${userBalance} 🪙.`
  });

  return currentLeaderboardEmbed;
};

const coinCurrentLeaderboardExecuteCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser,
  _args
): Promise<SapphireMessageResponse> => {
  const userId = getUserIdFromMessage(messageFromUser);
  const leaderboard = await getCurrentCoinLeaderboard();
  return getCurrentCoinLeaderboardEmbed(client, leaderboard, userId);
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
  codeyCommandResponseType: CodeyCommandResponseType.EMBED,

  options: [],
  subcommandDetails: {}
};
