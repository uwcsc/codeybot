import { container } from '@sapphire/framework';
import { Message, TextBasedChannel } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireAfterReplyType,
  SapphireMessageExecuteType,
  SapphireMessageResponseWithMetadata,
} from '../../codeyCommand';
import { CodeyUserError } from '../../codeyUserError';
import {
  getMessageForLeetcodeProblem,
  getLeetcodeProblemDataFromId,
  createInitialValuesForTags,
  getListOfLeetcodeProblemIds,
  LeetcodeDifficulty,
  TOTAL_NUMBER_OF_PROBLEMS,
} from '../../components/leetcode';
import { getRandomIntFrom1 } from '../../utils/num';

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
    messageFromUser,
  });
};

const leetcodeRandomAfterMessageReply: SapphireAfterReplyType = async (
  result,
  _sentMessage,
): Promise<unknown> => {
  // The API might take more than 3 seconds to complete
  // Which is more than the timeout for slash commands
  // So we just send a separate message to the channel which the command was called from.

  const difficulty = <LeetcodeDifficulty | undefined>result.metadata['difficulty'];
  const tag = <string | undefined>result.metadata['tag'];
  const message = <Message<boolean>>result.metadata['messageFromUser'];
  const channel = <TextBasedChannel>message.channel;

  let problemId;
  if (typeof difficulty === 'undefined' && typeof tag === 'undefined') {
    problemId = getRandomIntFrom1(TOTAL_NUMBER_OF_PROBLEMS);
  } else {
    const problemIds = await getListOfLeetcodeProblemIds(difficulty, tag);
    const index = getRandomIntFrom1(problemIds.length) - 1;
    if (problemIds.length === 0) {
      throw new CodeyUserError(message, 'There are no problems with the specified filters.');
    }
    problemId = problemIds[index];
  }
  const problemData = await getLeetcodeProblemDataFromId(problemId);
  const content = getMessageForLeetcodeProblem(problemData).slice(0, 2000);

  await channel?.send(content);
  return;
};

export const leetcodeRandomCommandDetails: CodeyCommandDetails = {
  name: 'random',
  aliases: ['r'],
  description: 'Get a random LeetCode problem.',
  detailedDescription: `**Examples:**
\`${container.botPrefix}leetcode\`\n
\`${container.botPrefix}leetcode random\``,

  isCommandResponseEphemeral: false,
  executeCommand: leetcodeRandomExecuteCommand,
  afterMessageReply: leetcodeRandomAfterMessageReply,
  options: [
    {
      name: 'difficulty',
      description: 'The difficulty of the problem.',
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
      description: 'The type of problem.',
      type: CodeyCommandOptionType.STRING,
      required: false,
      choices: createInitialValuesForTags(),
    },
  ],
  subcommandDetails: {},
};
