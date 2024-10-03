import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { officeCommandDetails } from '../../commandDetails/miscellaneous/office';

export class MiscellaneousOfficeCommand extends CodeyCommand {
  details = officeCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: officeCommandDetails.aliases,
      description: officeCommandDetails.description,
      detailedDescription: officeCommandDetails.detailedDescription,
    });
  }
}
