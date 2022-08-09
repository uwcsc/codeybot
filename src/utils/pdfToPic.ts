import { fromPath } from 'pdf2pic';

const options = {
  density: 100,
  saveFilename: 'untitled',
  savePath: './tmp',
  format: 'png',
  width: 600,
  height: 600
};

export const convertPdfToPic = async (filePath: string, pageToConvertAsImage: number) => {
  const storeAsImage = fromPath(filePath, options);
  const res = await storeAsImage(pageToConvertAsImage);
  console.log('Page 1 is now converted as image');

  return res;
};
