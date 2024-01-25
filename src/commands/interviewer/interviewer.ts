import { Subcommand } from '@sapphire/plugin-subcommands';
import { CodeyCommand } from '../../codeyCommand';
import { interviewerCommandDetails } from '../../commandDetails/interviewer/interviewer';

export class MiscellaneousInterviewerCommand extends CodeyCommand {
  details = interviewerCommandDetails;

  public constructor(context: Subcommand.Context, options: Subcommand.Options) {
    super(context, {
      ...options,
      aliases: interviewerCommandDetails.aliases,
      description: interviewerCommandDetails.description,
      detailedDescription: interviewerCommandDetails.detailedDescription,
    });
  }
}