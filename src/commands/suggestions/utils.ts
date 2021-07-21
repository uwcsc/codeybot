import _ from 'lodash';
import { suggestionStatesReadable, getAvailableStatesString } from '../../components/suggestions';

export const validateIDs = (value: string): boolean | string => {
  // Split by white space
  const values = value.split(' ').map((a) => Number(a));

  // validate each id after first word
  if (_.some(values, isNaN)) {
    return `you entered an invalid id. Please enter numbers only.`;
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
