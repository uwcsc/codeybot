// Integer in [0, max - 1]
const getRandomIntFrom0 = (max: number): number => {
  return Math.floor(Math.random() * max);
};

// Integer in [1, max]
export const getRandomIntFrom1 = (max: number): number => {
  return getRandomIntFrom0(max) + 1;
};
