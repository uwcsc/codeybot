import { availableLists, getAvailableListsString } from '../../components/suggestions';

export const validateListArg = (value: string): boolean | string => {
  // validate if this is one of the available domains
  if (value.toLowerCase() in availableLists) return true;
  return `you entered an invalid list. Please enter one of ${getAvailableListsString()}.`;
};

export const parseListArg = (value: string): string => {
  // lowercase List arg value
  return value.toLowerCase();
};
