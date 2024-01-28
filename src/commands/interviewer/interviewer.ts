import { Subcommand } from '@sapphire/plugin-subcommands';
import { container } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { interviewerClearCommandDetails } from '../../commandDetails/interviewer/clear';
import { interviewerDomainCommandDetails } from '../../commandDetails/interviewer/domain';
import { interviewerPauseCommandDetails } from '../../commandDetails/interviewer/pause';
import { interviewerProfileCommandDetails } from '../../commandDetails/interviewer/profile';
import { interviewerResumeCommandDetails } from '../../commandDetails/interviewer/resume';
import { interviewerSignupCommandDetails } from '../../commandDetails/interviewer/signup';
import { interviewerListCommandDetails } from '../../commandDetails/interviewer/list';

export const interviewerCommandDetails: CodeyCommandDetails = {
  name: 'interviewers',
  aliases: ['int'],
  description: 'Handle interviewer functions.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}interviewer\`
\`${container.botPrefix}interviewer frontend\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Getting interviewer information...',
  messageIfFailure: 'Could not retrieve interviewer information.',
  options: [],
  subcommandDetails: {
    clear: interviewerClearCommandDetails,
    domain: interviewerDomainCommandDetails,
    pause: interviewerPauseCommandDetails,
    profile: interviewerProfileCommandDetails,
    resume: interviewerResumeCommandDetails,
    signup: interviewerSignupCommandDetails,
    list: interviewerListCommandDetails,
  },
  defaultSubcommandDetails: interviewerListCommandDetails,
};

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
