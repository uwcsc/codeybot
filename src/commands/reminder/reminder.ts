import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { reminderCommandDetails } from '../../commandDetails/reminder/reminder';

export class ReminderCommand extends CodeyCommand {
  details = reminderCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: reminderCommandDetails.aliases,
      description: reminderCommandDetails.description,
      detailedDescription: reminderCommandDetails.detailedDescription,
    });
  }
}
