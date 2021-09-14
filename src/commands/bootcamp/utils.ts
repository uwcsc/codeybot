import { max } from 'lodash';

export const toTitleCase = (str: string): string => {
  return str.replace(/-/g, ' ').replace(/\w\S*/g, function (txt: string) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

export const lowestInt = (nums: number[]): number => {
  for (let i = 0; i < (max(nums) || 0); i++) {
    if (!nums.includes(i)) {
      return i;
    }
  }
  return nums.length;
};
