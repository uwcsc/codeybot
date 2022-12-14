import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { infoCommandDetails } from '../../commandDetails/miscellaneous/info';

export class MiscellaneousInfoCommand extends CodeyCommand {
  details = infoCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: infoCommandDetails.aliases,
      description: infoCommandDetails.description,
      detailedDescription: infoCommandDetails.detailedDescription,
    });
  }
}
