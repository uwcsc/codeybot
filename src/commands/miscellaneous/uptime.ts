import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { uptimeCommandDetails } from '../../commandDetails/miscellaneous/uptime';

export class MiscellaneousUptimeCommand extends CodeyCommand {
  details = uptimeCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: uptimeCommandDetails.aliases,
      description: uptimeCommandDetails.description,
      detailedDescription: uptimeCommandDetails.detailedDescription,
    });
  }
}
