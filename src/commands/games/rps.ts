import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { rpsCommandDetails } from '../../commandDetails/games/rps';

export class GamesRpsCommand extends CodeyCommand {
  details = rpsCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: rpsCommandDetails.aliases,
      description: rpsCommandDetails.description,
      detailedDescription: rpsCommandDetails.detailedDescription,
    });
  }
}
