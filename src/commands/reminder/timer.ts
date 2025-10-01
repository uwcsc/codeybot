import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand';
import { timerCommandDetails } from '../../commandDetails/reminder/timer';

export class TimerCommand extends CodeyCommand {
  details = timerCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: timerCommandDetails.aliases,
      description: timerCommandDetails.description,
      detailedDescription: timerCommandDetails.detailedDescription,
    });
  }
}
