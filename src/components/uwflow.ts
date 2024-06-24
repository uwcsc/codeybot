import axios from 'axios';

// UWFlow API URL
const uwflowApiUrl = 'https://uwflow.com/graphql';

// Course info interface for UWFlow
interface courseInfoFromUrl {
  data: {
    course: [
      {
        code: string;
        name: string;
        description: string;
        rating: {
          liked: number;
          easy: number;
          useful: number;
          filled_count: number;
          comment_count: number;
        };
      },
    ];
  };
}

// Course info interface for CodeyBot
export interface courseInfo {
  code: string;
  name: string;
  description: string;
  liked: number;
  easy: number;
  useful: number;
  filled_count: number;
  comment_count: number;
}

// Course requisites interface for UWFlow
interface courseReqsFromUrl {
  data: {
    course: [
      {
        code: string;
        id: number;
        antireqs: string | null;
        prereqs: string | null;
        coreqs: string | null;
      },
    ];
  };
}

// Course requisites interface for CodeyBot
export interface courseReqs {
  code: string;
  antireqs: string;
  prereqs: string;
  coreqs: string;
}

// Format string
const formatInput = (input: string | null): string => {
  if (input === null) {
    return 'None';
  }

  return input;
};

// Retrieve course info
export const getCourseInfo = async (courseCode: string): Promise<courseInfo | number> => {
  const resultFromUWFLow: courseInfoFromUrl = (
    await axios.post(uwflowApiUrl, {
      operationName: 'getCourse',
      variables: {
        code: courseCode,
      },
      query: `query getCourse($code: String) {
            course(where: { code: { _eq: $code } }) {
                code
                name
                description
                rating {
                    liked
                    easy
                    useful
                    filled_count
                    comment_count
                }
            }
        }`,
    })
  ).data;

  // If no data is found, return -1 to signal error
  if (resultFromUWFLow.data.course.length < 1) {
    return -1;
  }

  const result: courseInfo = {
    code: resultFromUWFLow.data.course[0].code,
    name: resultFromUWFLow.data.course[0].name,
    description: resultFromUWFLow.data.course[0].description,
    liked: resultFromUWFLow.data.course[0].rating.liked,
    easy: resultFromUWFLow.data.course[0].rating.easy,
    useful: resultFromUWFLow.data.course[0].rating.useful,
    filled_count: resultFromUWFLow.data.course[0].rating.filled_count,
    comment_count: resultFromUWFLow.data.course[0].rating.comment_count,
  };

  return result;
};

// Retrieve course requisites
export const getCourseReqs = async (courseCode: string): Promise<courseReqs | number> => {
  const resultFromUWFLow: courseReqsFromUrl = (
    await axios.post(uwflowApiUrl, {
      operationName: 'getCourse',
      variables: {
        code: courseCode,
      },
      query: `query getCourse($code: String) {
            course(where: { code: { _eq: $code }}) {
                code
                id
                antireqs
                prereqs
                coreqs
            }
        }`,
    })
  ).data;

  // If no data is found, return -1 to signal error
  if (resultFromUWFLow.data.course.length < 1) {
    return -1;
  }

  const result: courseReqs = {
    code: resultFromUWFLow.data.course[0].code,
    antireqs: formatInput(resultFromUWFLow.data.course[0].antireqs),
    prereqs: formatInput(resultFromUWFLow.data.course[0].prereqs),
    coreqs: formatInput(resultFromUWFLow.data.course[0].coreqs),
  };

  return result;
};
