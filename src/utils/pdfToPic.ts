import { fromPath } from 'pdf2pic';
import { ToBase64Response } from 'pdf2pic/dist/types/toBase64Response';
import { WriteImageResponse } from 'pdf2pic/dist/types/writeImageResponse';

export const convertPdfToPic = async (
  filePath: string,
  pageToConvertAsImage: number,
  saveFileName: string,
  width: number,
  height: number
): Promise<WriteImageResponse | ToBase64Response> => {
  const options = {
    density: 500,
    saveFilename: saveFileName,
    savePath: './tmp',
    format: 'png',
    width: width,
    height: height
  };

  const storeAsImage = fromPath(filePath, options);
  const res = await storeAsImage(pageToConvertAsImage);
  return res;
};
