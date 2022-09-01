import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { flipCoinCommandDetails } from '../../commandDetails/fun/flipCoin';

export class FunFlipCoinCommand extends CodeyCommand {
  details = flipCoinCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: flipCoinCommandDetails.aliases,
      description: flipCoinCommandDetails.description,
      detailedDescription: flipCoinCommandDetails.detailedDescription,
    });
  }
}
