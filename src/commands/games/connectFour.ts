import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { connectFourCommandDetails } from '../../commandDetails/games/rps';

export class GamesConnectFourCommand extends CodeyCommand {
  details = connectFourCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: rpsCommandDetails.aliases,
      description: rpsCommandDetails.description,
      detailedDescription: rpsCommandDetails.detailedDescription,
    });
  }
}
