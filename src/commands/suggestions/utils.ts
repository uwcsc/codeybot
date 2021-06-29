import { suggestionStates, getAvailableListsString } from '../../components/suggestions';

export const validateState = (value: string): boolean | string => {
  // validate if this is one of the available states
  if (value.toLowerCase() in suggestionStates) return true;
  return `you entered an invalid state. Please enter one of ${getAvailableListsString()}.`;
};

export const parseListArg = (value: string): string => {
  return value.toLowerCase();
};
