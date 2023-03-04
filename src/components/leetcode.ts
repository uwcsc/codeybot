import axios from 'axios';
import { APIApplicationCommandOptionChoice } from 'discord-api-types/v9';
import { convertHtmlToMarkdown } from '../utils/markdown';

const leetcodeIdUrl = 'https://lcid.cc/info';
const leetcodeApiUrl = 'https://leetcode.com/graphql';
const leetcodeUrl = 'https://leetcode.com/problems';

const LeetcodeTagsDict = {
  array: 'Array',
  string: 'String',
  'hash-table': 'Hash Table',
  'dynamic-programming': 'Dynamic Programming',
  math: 'Math',
  sorting: 'Sorting',
  greedy: 'Greedy',
  'depth-first-search': 'Depth-First Search',
  database: 'Database',
  'binary-search': 'Binary Search',
  'breadth-first-search': 'Breadth-First Search',
  tree: 'Tree',
  matrix: 'Matrix',
  'binary-tree': 'Binary Tree',
  'two-pointers': 'Two Pointers',
  'bit-manipulation': 'Bit Manipulation',
  stack: 'Stack',
  'heap-priority-queue': 'Heap (Priority Queue)',
  graph: 'Graph',
  design: 'Design',
  'prefix-sum': 'Prefix Sum',
  simulation: 'Simulation',
  counting: 'Counting',
  backtracking: 'Backtracking',
  'sliding-window': 'Sliding Window',
};

interface LeetcodeTopicTag {
  name: string;
}

export enum LeetcodeDifficulty {
  'Easy',
  'Medium',
  'Hard',
}

interface LeetcodeIdProblemDataFromUrl {
  difficulty: LeetcodeDifficulty;
  likes: number;
  dislikes: number;
  categoryTitle: string;
  frontendQuestionId: number;
  paidOnly: boolean;
  title: string;
  titleSlug: string;
  topicTags: LeetcodeTopicTag[];
  totalAcceptedRaw: number;
  totalSubmissionRaw: number;
}

interface LeetcodeProblemDataFromUrl {
  data: {
    question: {
      content: string;
    };
  };
}

interface LeetcodeProblemData {
  difficulty: LeetcodeDifficulty;
  likes: number;
  dislikes: number;
  categoryTitle: string;
  paidOnly: boolean;
  title: string;
  titleSlug: string;
  topicTags: LeetcodeTopicTag[];
  totalAcceptedRaw: number;
  totalSubmissionRaw: number;
  contentAsMarkdown: string;
  problemId: number;
}

export const createInitialValuesForTags = (): APIApplicationCommandOptionChoice[] => {
  return [
    ...Object.entries(LeetcodeTagsDict).map((e) => {
      return {
        name: e[1],
        value: e[0],
      };
    }),
  ];
};

export const getLeetcodeProblemDataFromId = async (
  problemId: number,
): Promise<LeetcodeProblemData> => {
  const resFromLeetcodeById: LeetcodeIdProblemDataFromUrl = (
    await axios.get(`${leetcodeIdUrl}/${problemId}`)
  ).data;
  const resFromLeetcode: LeetcodeProblemDataFromUrl = (
    await axios.get(leetcodeApiUrl, {
      params: {
        operationName: 'questionData',
        variables: {
          titleSlug: resFromLeetcodeById.titleSlug,
        },
        query:
          'query questionData($titleSlug: String!) {\n  question(titleSlug: $titleSlug) {\n    questionId\n    questionFrontendId\n    boundTopicId\n    title\n    titleSlug\n    content\n    translatedTitle\n    translatedContent\n    isPaidOnly\n    difficulty\n    likes\n    dislikes\n    isLiked\n    similarQuestions\n    contributors {\n      username\n      profileUrl\n      avatarUrl\n      __typename\n    }\n    langToValidPlayground\n    topicTags {\n      name\n      slug\n      translatedName\n      __typename\n    }\n    companyTagStats\n    codeSnippets {\n      lang\n      langSlug\n      code\n      __typename\n    }\n    stats\n    hints\n    solution {\n      id\n      canSeeDetail\n      __typename\n    }\n    status\n    sampleTestCase\n    metaData\n    judgerAvailable\n    judgeType\n    mysqlSchemas\n    enableRunCode\n    enableTestMode\n    envInfo\n    libraryUrl\n    __typename\n  }\n}\n',
      },
    })
  ).data;

  const result: LeetcodeProblemData = {
    ...resFromLeetcodeById,
    contentAsMarkdown: convertHtmlToMarkdown(resFromLeetcode.data.question.content),
    problemId: problemId,
  };
  return result;
};

export const getListOfLeetcodeProblemIds = async (
  difficulty?: LeetcodeDifficulty,
  tag?: string,
): Promise<number[]> => {
  const filters = {
    ...(typeof difficulty !== 'undefined'
      ? { difficulty: difficulty.toString().toUpperCase() }
      : {}),
    ...(typeof tag !== 'undefined' ? { tags: [tag] } : {}),
  };
  const resFromLeetcode = (
    await axios.get(leetcodeApiUrl, {
      params: {
        variables: {
          categorySlug: '',
          filters: filters,
          limit: 2000,
          skip: 0,
        },
        query:
          'query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {\n  problemsetQuestionList: questionList(\n    categorySlug: $categorySlug\n    limit: $limit\n    skip: $skip\n    filters: $filters\n  ) {\n    total: totalNum\n    questions: data {\n      acRate\n      difficulty\n      freqBar\n      frontendQuestionId: questionFrontendId\n      isFavor\n      paidOnly: isPaidOnly\n      status\n      title\n      titleSlug\n      topicTags {\n        name\n        id\n        slug\n      }\n      hasSolution\n      hasVideoSolution\n    }\n  }\n}\n    ',
      },
    })
  ).data;
  const result = resFromLeetcode.data.problemsetQuestionList.questions.map(
    (question: { frontendQuestionId: number }) => question.frontendQuestionId,
  );
  return result;
};

export const totalNumberOfProblems = 2577;

export const getMessageForLeetcodeProblem = (leetcodeProblemData: LeetcodeProblemData): string => {
  const title = `#${leetcodeProblemData.problemId}: ${leetcodeProblemData.title}`;
  const content = leetcodeProblemData.contentAsMarkdown;
  const url = `${leetcodeUrl}/${leetcodeProblemData.titleSlug}`;
  const difficulty = leetcodeProblemData.difficulty;
  return `**${title} - ${difficulty}**\n*Problem URL: ${url}*\n\n${content}`;
};
