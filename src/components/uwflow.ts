import axios from 'axios';

const uwflowApiUrl = 'https://uwflow.com/graphql';

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

export const getCourseInfo = async (courseCode: string): Promise<courseInfo | string> => {
  const resultFromUWFLow: courseInfoFromUrl = (
    await axios.post(uwflowApiUrl, {
      operationName: 'getCourse',
      variables: {
        code: courseCode,
      },
      query:
        'query getCourse($code: String) {\n course(where: { code: { _eq: $code } }) {\n code\n name\n description\n rating {\n liked\n easy\n useful\n filled_count\n comment_count\n}\n}\n}\n',
    })
  ).data;

  if (resultFromUWFLow.data.course.length < 1) {
    return 'Oops, course does not exist!';
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
