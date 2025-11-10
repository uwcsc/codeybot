import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { paginationTestCommandDetails } from '../../commandDetails/miscellaneous/pagination-test';

export class MiscellaneousPaginationTestCommand extends CodeyCommand {
  details = paginationTestCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: paginationTestCommandDetails.aliases,
      description: paginationTestCommandDetails.description,
      detailedDescription: paginationTestCommandDetails.detailedDescription,
    });
  }
}
