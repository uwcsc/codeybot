import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { banCommandDetails } from '../../commandDetails/admin/ban';

export class AdminBanCommand extends CodeyCommand {
  details = banCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: banCommandDetails.aliases,
      description: banCommandDetails.description,
      detailedDescription: banCommandDetails.detailedDescription,
    });
  }
}
