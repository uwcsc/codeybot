import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { connectFourCommandDetails } from '../../commandDetails/games/connectFour';

export class GamesConnectFourCommand extends CodeyCommand {
  details = connectFourCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: connectFourCommandDetails.aliases,
      description: connectFourCommandDetails.description,
      detailedDescription: connectFourCommandDetails.detailedDescription,
    });
  }
}
