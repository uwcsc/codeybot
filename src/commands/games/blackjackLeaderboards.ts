import { Command, container } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { blackjackWinrateLeaderboardCommandDetails } from '../../commandDetails/games/blackjackLeaderboards/winrate';
import { blackjackTotalLeaderboardCommandDetails } from '../../commandDetails/games/blackjackLeaderboards/total';

const blackjackLeaderboardsCommandDetails: CodeyCommandDetails = {
  name: 'blackjackleaderboards',
  aliases: ['blackjacklb', 'bjlb'],
  description: 'Handle blackjack leaderboard functions.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}blackjackleaderboards winrate @Codey\`
\`${container.botPrefix}blackjackleaderboards total @Codey\``,
  options: [],
  subcommandDetails: {
    winrate: blackjackWinrateLeaderboardCommandDetails,
    total: blackjackTotalLeaderboardCommandDetails,
  },
  defaultSubcommandDetails: blackjackWinrateLeaderboardCommandDetails,
};

export class GamesBlackjackLeaderboardsCommand extends CodeyCommand {
  details = blackjackLeaderboardsCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: blackjackLeaderboardsCommandDetails.aliases,
      description: blackjackLeaderboardsCommandDetails.description,
      detailedDescription: blackjackLeaderboardsCommandDetails.detailedDescription,
    });
  }
}
