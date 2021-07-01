import { suggestionStates, getAvailableStatesString } from '../../components/suggestions';

export const validateState = (value: string): boolean | string => {
  // validate if this is one of the available states
  if (value.toLowerCase() in suggestionStates) return true;
  return `you entered an invalid state. Please enter one of ${getAvailableStatesString()}.`;
};

export const parseStateArg = (value: string): string => {
  return value.toLowerCase();
};
