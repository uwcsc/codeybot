import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { pingCommandDetails } from '../../commandDetails/miscellaneous/ping';

export class MiscellaneousPingCommand extends CodeyCommand {
  details = pingCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: pingCommandDetails.aliases,
      description: pingCommandDetails.description,
      detailedDescription: pingCommandDetails.detailedDescription,
    });
  }
}
