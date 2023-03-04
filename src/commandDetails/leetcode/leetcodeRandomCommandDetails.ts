import { container } from '@sapphire/framework';
import { TextBasedChannel } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireAfterReplyType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  SapphireMessageResponseWithMetadata,
} from '../../codeyCommand';
import {
  getMessageForLeetcodeProblem,
  getLeetcodeProblemDataFromId,
  createInitialValuesForTags,
  getListOfLeetcodeProblemIds,
  LeetcodeDifficulty,
  totalNumberOfProblems,
} from '../../components/leetcode';
import { getRandomIntFrom1 } from '../../utils/num';

// Check a user's balance
const leetcodeRandomExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponseWithMetadata> => {
  const difficulty = <LeetcodeDifficulty | undefined>args['difficulty'];
  const tag = <string | undefined>args['tag'];

  return new SapphireMessageResponseWithMetadata('The problem will be loaded shortly...', {
    difficulty,
    tag,
    channel: messageFromUser.channel,
  });
};

const leetcodeRandomAfterMessageReply: SapphireAfterReplyType = async (
  result,
  sentMessage,
): Promise<unknown> => {
  // The API might take more than 3 seconds to complete
  // Which is more than the timeout for slash commands
  // So we just send a separate message to the channel which the command was called from.

  const difficulty = <LeetcodeDifficulty | undefined>result.metadata['difficulty'];
  const tag = <string | undefined>result.metadata['tag'];
  const channel = <TextBasedChannel>result.metadata['channel'];

  let problemId;
  if (typeof difficulty === 'undefined' && typeof tag === 'undefined') {
    problemId = getRandomIntFrom1(totalNumberOfProblems);
  } else {
    const problemIds = await getListOfLeetcodeProblemIds(difficulty, tag);
    const index = getRandomIntFrom1(problemIds.length) - 1;
    problemId = problemIds[index];
  }
  const problemData = await getLeetcodeProblemDataFromId(problemId);
  await channel?.send(getMessageForLeetcodeProblem(problemData));
  return;
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
  afterMessageReply: leetcodeRandomAfterMessageReply,
  options: [
    {
      name: 'difficulty',
      description: 'The difficulty of the problem to filter by if specified.',
      type: CodeyCommandOptionType.STRING,
      required: false,
      choices: [
        { name: 'Easy', value: 'easy' },
        { name: 'Medium', value: 'medium' },
        { name: 'Hard', value: 'hard' },
      ],
    },
    {
      name: 'tag',
      description: 'The type of problem to filter by if specified.',
      type: CodeyCommandOptionType.STRING,
      required: false,
      choices: createInitialValuesForTags(),
    },
  ],
  subcommandDetails: {},
};
