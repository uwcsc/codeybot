import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { memberCommandDetails } from '../../commandDetails/miscellaneous/member';

export class MiscellaneousMemberCommand extends CodeyCommand {
  details = memberCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: memberCommandDetails.aliases,
      description: memberCommandDetails.description,
      detailedDescription: memberCommandDetails.detailedDescription,
    });
  }
}
