import { container } from '@sapphire/framework';
import { User } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { CodeyUserError } from '../../codeyUserError';
import {
  getMessageForLeetcodeProblem,
  getLeetcodeProblemDataFromId,
} from '../../components/leetcode';

// Check a user's balance
const leetcodeSpecificExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const problemId = <number>args['problem-id'];
  if (!Number.isInteger(problemId)) {
    throw new CodeyUserError(messageFromUser, 'Problem ID must be an integer.');
  }
  const result = await getLeetcodeProblemDataFromId(problemId);

  return getMessageForLeetcodeProblem(result);
};

export const leetcodeSpecificCommandDetails: CodeyCommandDetails = {
  name: 'specific',
  aliases: ['spec'],
  description: 'Get a Leetcode problem with specified problem ID.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}leetcode specific 1\``,

  isCommandResponseEphemeral: false,
  executeCommand: leetcodeSpecificExecuteCommand,
  options: [
    {
      name: 'problem-id',
      description: 'The problem id for the Leetcode problem.',
      type: CodeyCommandOptionType.NUMBER,
      required: true,
    },
  ],
  subcommandDetails: {},
};
