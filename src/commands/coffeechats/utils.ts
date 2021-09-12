export const validateNumArg = (value: string): boolean | string => {
  if (isNaN(parseInt(value))) {
    return `Please enter a valid integer.`;
  }
  return true;
};

export const parseNumArg = (value: string): number => {
  return parseInt(value);
};
