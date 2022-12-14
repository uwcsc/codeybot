import { fromPath } from 'pdf2pic';
import { WriteImageResponse } from 'pdf2pic/dist/types/writeImageResponse';

export const convertPdfToPic = async (
  filePath: string,
  saveFileName: string,
  width: number,
  height: number,
): Promise<WriteImageResponse[]> => {
  const options = {
    density: 500,
    saveFilename: saveFileName,
    savePath: './tmp',
    format: 'png',
    width: width,
    height: height,
  };

  const convert = fromPath(filePath, options);
  const res = await convert.bulk!(-1);
  return res;
};
