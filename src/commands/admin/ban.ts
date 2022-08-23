import { Command, container } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { banCommandDetails } from '../../commandDetails/admin/ban';

export class BanCommand extends CodeyCommand {
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
