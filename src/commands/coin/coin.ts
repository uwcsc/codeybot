import { Command, container } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { coinAdjustCommandDetails } from '../../commandDetails/coin/adjust';
import { coinBalanceCommandDetails } from '../../commandDetails/coin/balance';
import { coinCheckCommandDetails } from '../../commandDetails/coin/check';
import { coinInfoCommandDetails } from '../../commandDetails/coin/info';
import { coinUpdateCommandDetails } from '../../commandDetails/coin/update';
import { coinCurrentLeaderboardCommandDetails } from '../../commandDetails/coin/leaderboard';

const coinCommandDetails: CodeyCommandDetails = {
  name: 'coin',
  aliases: [],
  description: 'Handles coin functions',
  detailedDescription: `**Examples:**
\`${container.botPrefix}coin adjust @Codey 100\`
\`${container.botPrefix}coin adjust @Codey -100 Codey broke.\`
\`${container.botPrefix}coin\`
\`${container.botPrefix}bal\`
\`${container.botPrefix}balance\`
\`${container.botPrefix}coin check @Codey\`
\`${container.botPrefix}coin c @Codey\`
\`${container.botPrefix}coin info\`
\`${container.botPrefix}coin i\`
\`${container.botPrefix}coin update @Codey 100\`
\`${container.botPrefix}coin update @Codey 0 Reset Codey's balance.\``,
  options: [],
  subcommandDetails: {
    adjust: coinAdjustCommandDetails,
    balance: coinBalanceCommandDetails,
    check: coinCheckCommandDetails,
    info: coinInfoCommandDetails,
    update: coinUpdateCommandDetails,
    leaderboard: coinCurrentLeaderboardCommandDetails
  },
  defaultSubcommandDetails: coinBalanceCommandDetails
};

export class CoinCommand extends CodeyCommand {
  details = coinCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: coinCommandDetails.aliases,
      description: coinCommandDetails.description,
      detailedDescription: coinCommandDetails.detailedDescription
    });
  }
}
