import { Command } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { interviewerClearCommandDetails } from '../../commandDetails/interviewer/clear';
import { interviewerDomainCommandDetails } from '../../commandDetails/interviewer/domain';
import { interviewerListCommandDetails } from '../../commandDetails/interviewer/list';
import { interviewerPauseCommandDetails } from '../../commandDetails/interviewer/pause';
import { interviewerProfileCommandDetails } from '../../commandDetails/interviewer/profile';
import { interviewerSignupCommandDetails } from '../../commandDetails/interviewer/signup';
import { interviewerResumeCommandDetails } from '../../commandDetails/interviewer/resume';

const interviewerCommandDetails: CodeyCommandDetails = {
  name: 'interviewer',
  aliases: [],
  description: 'Handles interviewer functions',
  detailedDescription: `TODO`,
  options: [],
  subcommandDetails: {
    clear: interviewerClearCommandDetails,
    domain: interviewerDomainCommandDetails,
    list: interviewerListCommandDetails,
    pause: interviewerPauseCommandDetails,
    profile: interviewerProfileCommandDetails,
    signup: interviewerSignupCommandDetails,
    resume: interviewerResumeCommandDetails
  },
  defaultSubcommandDetails: interviewerListCommandDetails
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
