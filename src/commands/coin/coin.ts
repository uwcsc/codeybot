import { Command, container } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { coinAdjustCommandDetails } from '../../commandDetails/coin/adjust';
import { coinCheckCommandDetails } from '../../commandDetails/coin/check';
import { coinInfoCommandDetails } from '../../commandDetails/coin/info';
import { coinLeaderboardCommandDetails } from '../../commandDetails/coin/leaderboard';
import { coinUpdateCommandDetails } from '../../commandDetails/coin/update';

const coinCommandDetails: CodeyCommandDetails = {
  name: 'coin',
  aliases: [],
  description: 'Handle coin functions.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}coin adjust @Codey 100\`
\`${container.botPrefix}coin adjust @Codey -100 Codey broke.\`
\`${container.botPrefix}coin\`
\`${container.botPrefix}coin check @Codey\`
\`${container.botPrefix}coin c @Codey\`
\`${container.botPrefix}coin info\`
\`${container.botPrefix}coin i\`
\`${container.botPrefix}coin update @Codey 100\`
\`${container.botPrefix}coin update @Codey 0 Reset Codey's balance.\``,
  options: [],
  subcommandDetails: {
    adjust: coinAdjustCommandDetails,
    check: coinCheckCommandDetails,
    info: coinInfoCommandDetails,
    update: coinUpdateCommandDetails,
    leaderboard: coinLeaderboardCommandDetails,
  },
  defaultSubcommandDetails: coinCheckCommandDetails,
};

export class CoinCommand extends CodeyCommand {
  details = coinCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: coinCommandDetails.aliases,
      description: coinCommandDetails.description,
      detailedDescription: coinCommandDetails.detailedDescription,
    });
  }
}
