import { Command, container } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { interviewerClearCommandDetails } from '../../commandDetails/interviewer/clear';
import { interviewerDomainCommandDetails } from '../../commandDetails/interviewer/domain';
import { interviewerListCommandDetails } from '../../commandDetails/interviewer/list';
import { interviewerPauseCommandDetails } from '../../commandDetails/interviewer/pause';
import { interviewerProfileCommandDetails } from '../../commandDetails/interviewer/profile';

const interviewerCommandDetails: CodeyCommandDetails = {
  name: 'interviewer',
  aliases: [],
  description: 'Handles interviewer functions',
  detailedDescription: `**Examples**
TODO: this
`,
  options: [],
  subcommandDetails: {
    clear: interviewerClearCommandDetails,
    domain: interviewerDomainCommandDetails,
    list: interviewerListCommandDetails,
    pause: interviewerPauseCommandDetails,
    profile: interviewerProfileCommandDetails,
  },
  defaultSubcommandDetails: 1,
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
