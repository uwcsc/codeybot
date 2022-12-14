import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { rollDiceCommandDetails } from '../../commandDetails/fun/rollDice';

export class FunRollDiceCommand extends CodeyCommand {
  details = rollDiceCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: rollDiceCommandDetails.aliases,
      description: rollDiceCommandDetails.description,
      detailedDescription: rollDiceCommandDetails.detailedDescription,
    });
  }
}
