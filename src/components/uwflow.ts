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

// Search results interface for UWflow
interface searchResultsFromUrl {
  data: {
    search_courses: [
      {
        name: string;
        code: string;
        has_prereqs: boolean;
      },
    ];
  };
}

// Search results interface for CodeyBot
export interface searchResults {
  name: string;
  code: string;
  has_prereqs: boolean;
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

// Retrieve courses in range of course code
export const getSearchResults = async (
  course: string,
  min: number,
  max: number,
): Promise<searchResults[] | number> => {
  const resultFromUWFLow: searchResultsFromUrl = (
    await axios.post(uwflowApiUrl, {
      operationName: 'explore',
      variables: {
        query: course,
        code_only: true,
      },
      query: `query explore($query: String, $code_only: Boolean) {
                search_courses(args: { query: $query, code_only: $code_only })  {
                    name
                    code
                    has_prereqs
                }
            }`,
    })
  ).data;

  // If no data is found, return -1 to signal error
  if (resultFromUWFLow.data.search_courses.length < 1) {
    return -1;
  }

  // Search results
  const results = resultFromUWFLow.data.search_courses;

  // Array of courses in range [min, max]
  const resultArray: searchResults[] = results.filter((result) => {
    const code = result.code;
    let numString = '';
    for (const char of code) {
      if (!isNaN(parseInt(char))) {
        numString += char;
      }
    }
    const num = parseInt(numString, 10);
    return min <= num && num <= max;
  });

  return resultArray;
};
