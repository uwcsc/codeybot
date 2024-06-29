import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { wordleCommandDetails } from '../../commandDetails/games/wordle';

export class GamesWordleCommand extends CodeyCommand {
  details = wordleCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: wordleCommandDetails.aliases,
      description: wordleCommandDetails.description,
      detailedDescription: wordleCommandDetails.detailedDescription,
    });
  }
}
