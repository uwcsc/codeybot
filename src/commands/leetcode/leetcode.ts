import { Command, container } from '@sapphire/framework';
import { CodeyCommand, CodeyCommandDetails } from '../../codeyCommand';
import { leetcodeSpecificCommandDetails } from '../../commandDetails/leetcode/leetcodeSpecificCommandDetails';

const leetcodeCommandDetails: CodeyCommandDetails = {
  name: 'leetcode',
  aliases: [],
  description: 'Handle coin functions.',
  detailedDescription: ``, // leave blank for now
  options: [],
  subcommandDetails: {
    // random
    specific: leetcodeSpecificCommandDetails,
  },
  defaultSubcommandDetails: leetcodeSpecificCommandDetails,
};

export class LeetcodeCommand extends CodeyCommand {
  details = leetcodeCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: leetcodeCommandDetails.aliases,
      description: leetcodeCommandDetails.description,
      detailedDescription: leetcodeCommandDetails.detailedDescription,
    });
  }
}
