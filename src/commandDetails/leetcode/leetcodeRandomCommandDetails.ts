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
  totalNumberOfLeetcodeProblems,
} from '../../components/leetcode';
import { getRandomIntFrom1 } from '../../utils/num';

// Check a user's balance
const leetcodeRandomExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const problemId = getRandomIntFrom1(totalNumberOfLeetcodeProblems);
  const result = await getLeetcodeProblemDataFromId(problemId);

  return getMessageForLeetcodeProblem(result);
};

export const leetcodeRandomCommandDetails: CodeyCommandDetails = {
  name: 'random',
  aliases: ['random'],
  description: 'Get a random Leetcode problem',
  detailedDescription: `**Examples:**
\`${container.botPrefix}leetcode\`\n
\`${container.botPrefix}leetcode random\``,

  isCommandResponseEphemeral: false,
  executeCommand: leetcodeRandomExecuteCommand,
  options: [],
  subcommandDetails: {},
};
