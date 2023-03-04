import axios from 'axios';
import { MessageEmbed } from 'discord.js';
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
  'union-find': 'Union Find',
  'linked-list': 'Linked List',
  'ordered-set': 'Ordered Set',
  'monotonic-stack': 'Monotonic Stack',
  enumeration: 'Enumeration',
  recursion: 'Recursion',
  trie: 'Trie',
  'divide-and-conquer': 'Divide and Conquer',
  'binary-search-tree': 'Binary Search Tree',
  queue: 'Queue',
  bitmask: 'Bitmask',
  memoization: 'Memoization',
  geometry: 'Geometry',
  'segment-tree': 'Segment Tree',
  'topological-sort': 'Topological Sort',
  'number-theory': 'Number Theory',
  'binary-indexed-tree': 'Binary Indexed Tree',
  'hash-function': 'Hash Function',
  'game-theory': 'Game Theory',
  combinatorics: 'Combinatorics',
  'shortest-path': 'Shortest Path',
  'data-stream': 'Data Stream',
  interactive: 'Interactive',
  'string-matching': 'String Matching',
  'rolling-hash': 'Rolling Hash',
  randomized: 'Randomized',
  brainteaser: 'Brainteaser',
  'monotonic-queue': 'Monotonic Queue',
  'merge-sort': 'Merge Sort',
  iterator: 'Iterator',
  concurrency: 'Concurrency',
  'doubly-linked-list': 'Doubly-Linked List',
  'probability-and-statistics': 'Probability and Statistics',
  quickselect: 'Quickselect',
  'bucket-sort': 'Bucket Sort',
  'suffix-array': 'Suffix Array',
  'minimum-spanning-tree': 'Minimum Spanning Tree',
  'counting-sort': 'Counting Sort',
  shell: 'Shell',
  'line-sweep': 'Line Sweep',
  'reservoir-sampling': 'Reservoir Sampling',
  'eulerian-circuit': 'Eulerian Circuit',
  'radix-sort': 'Radix Sort',
  'strongly-connected-component': 'Strongly Connected Component',
  'rejection-sampling': 'Rejection Sampling',
  'biconnected-component': 'Biconnected Component',
};

interface LeetcodeTopicTag {
  name: string;
}

enum LeetcodeDifficulty {
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

interface LeetcodeProblemQuery {
  difficulty: LeetcodeDifficulty;
  tags: string;
}

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

export const getMessageForLeetcodeProblem = (leetcodeProblemData: LeetcodeProblemData): string => {
  const title = `#${leetcodeProblemData.problemId}: ${leetcodeProblemData.title}`;
  const content = leetcodeProblemData.contentAsMarkdown;
  const url = `${leetcodeUrl}/${leetcodeProblemData.titleSlug}`;
  const difficulty = leetcodeProblemData.difficulty;
  return `**${title} - ${difficulty}**\n*Problem URL: ${url}*\n\n${content}`;
};
