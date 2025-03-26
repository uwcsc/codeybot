import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { worldleCommandDetails } from '../../commandDetails/games/worldle';

export class GamesWorldleCommand extends CodeyCommand {
  details = worldleCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: worldleCommandDetails.aliases,
      description: worldleCommandDetails.description,
      detailedDescription: worldleCommandDetails.detailedDescription,
    });
  }
}
