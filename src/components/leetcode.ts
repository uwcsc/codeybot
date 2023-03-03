import axios from 'axios';
import { convertHtmlToMarkdown } from '../utils/markdown';

const leetcodeIdUrl = 'https://lcid.cc/info';
const leetcodeUrl = 'https://leetcode.com/graphql';

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
  topicTags: LeetcodeTopicTag[];
  totalAcceptedRaw: number;
  totalSubmissionRaw: number;
  contentAsMarkdown: string;
}

export const getLeetcodeProblemDataFromId = async (
  problemId: number,
): Promise<LeetcodeProblemData> => {
  const resFromLeetcodeById: LeetcodeIdProblemDataFromUrl = (
    await axios.get(`${leetcodeIdUrl}/${problemId}`)
  ).data;
  const resFromLeetcode: LeetcodeProblemDataFromUrl = (
    await axios.get(leetcodeUrl, {
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
  };
  return result;
};
