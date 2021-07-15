import { suggestionStatesReadable, getAvailableStatesString } from '../../components/suggestions';

export const validateUpdate = (value: string): boolean | string => {
  // Split by white space
  const values = value.split(' ');
  const state = values[0];
  // validate if first word is one of the available states
  if (!(state.toLowerCase() in suggestionStatesReadable)) {
    return `you entered an invalid state. Please enter one of ${getAvailableStatesString()}.`;
  }

  // validate each id after first word
  for (let i = 1; i < values.length; i++) {
    if (isNaN(Number(values[i]))) {
      return `you entered an invalid id: ${values[i]}. Please enter numbers only.`;
    }
  }
  return true;
};

export const validateState = (value: string): boolean | string => {
  // validate if this is one of the available states
  if (value.toLowerCase() in suggestionStatesReadable) return true;
  return `you entered an invalid state. Please enter one of ${getAvailableStatesString()}.`;
};

export const parseStateArg = (value: string): string => {
  return value.toLowerCase();
};
