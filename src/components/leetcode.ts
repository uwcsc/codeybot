import axios from 'axios';
import { MessageEmbed } from 'discord.js';
import { convertHtmlToMarkdown } from '../utils/markdown';

const leetcodeIdUrl = 'https://lcid.cc/info';
const leetcodeApiUrl = 'https://leetcode.com/graphql';
const leetcodeUrl = 'https://leetcode.com/problems';

interface LeetcodeTopicTag {
  name: string;
}

interface LeetcodeIdProblemDataFromUrl {
  difficulty: 'Easy' | 'Medium' | 'Hard';
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
  difficulty: 'Easy' | 'Medium' | 'Hard';
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

// I couldn't find a way to get this dynamically, so a constant suffices for now
export const totalNumberOfLeetcodeProblems = 2577;

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
