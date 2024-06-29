import { readFileSync } from 'fs';

const WORDLE_POSSIBLE: string[] = [];
const WORDLE_ACCEPTABLE: string[] = [];

interface wordleJson {
  possible: string[];
  allowed: string[];
}

const setWordleWords = (): void => {
  const json: wordleJson = JSON.parse(readFileSync('data/wordle.json').toString());

  WORDLE_POSSIBLE.push(...json.possible);
  WORDLE_ACCEPTABLE.push(...json.allowed);
};

export const getWordlePossible = (): string[] => {
  if (WORDLE_POSSIBLE.length === 0) {
    setWordleWords();
  }

  return WORDLE_POSSIBLE;
};

export const getWordleAcceptable = (): string[] => {
  if (WORDLE_ACCEPTABLE.length === 0) {
    setWordleWords();
  }

  return WORDLE_ACCEPTABLE;
};
