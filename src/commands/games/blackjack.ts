import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { blackjackCommandDetails } from '../../commandDetails/games/blackjack';

export class GamesBlackjackCommand extends CodeyCommand {
  details = blackjackCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: blackjackCommandDetails.aliases,
      description: blackjackCommandDetails.description,
      detailedDescription: blackjackCommandDetails.detailedDescription,
    });
  }
}
