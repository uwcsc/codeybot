import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { helpCommandDetails } from '../../commandDetails/miscellaneous/help';

export class MiscellaneousHelpCommand extends CodeyCommand {
  details = helpCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: helpCommandDetails.aliases,
      description: helpCommandDetails.description,
      detailedDescription: helpCommandDetails.detailedDescription,
    });
  }
}
