import { Command, container } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { interviewerClearCommandDetails } from '../../commandDetails/interviewer/clear';

const interviewerCommandDetails: CodeyCommandDetails = {
  name: 'interviewer',
  aliases: [],
  description: 'Handles interviewer functions',
  detailedDescription: `**Examples**
TODO: this
`,
  options: [],
  subcommandDetails: {
    clear: interviewerClearCommandDetails
  },
  defaultSubcommandDetails: TODO
};

export class InterviewerCommand extends CodeyCommand {
  details = interviewerCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: interviewerCommandDetails.aliases,
      description: interviewerCommandDetails.description,
      detailedDescription: interviewerCommandDetails.detailedDescription
    });
  }
}
