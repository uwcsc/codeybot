import { container } from '@sapphire/framework';

import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { getWordleAcceptable, getWordlePossible } from '../../utils/data';
import { binaryFind } from '../../utils/find';

const getWordleWord = (): string => {
  const possibleWords = getWordlePossible();
  return possibleWords[Math.floor(Math.random() * possibleWords.length)];
};

const isWordleAcceptable = (word: string): boolean => {
  const acceptableWords = getWordleAcceptable();
  const possibleWords = getWordlePossible();

  // Acceptable words is a much larger list so checking possible first, which is strictly
  // more common words is better.
  return binaryFind(possibleWords, word) || binaryFind(acceptableWords, word);
};

const wordleExecuteCommand: SapphireMessageExecuteType =
  async (): Promise<SapphireMessageResponse> => {
    const word = getWordleWord();
    const isAcceptable = isWordleAcceptable(word);
    return (isAcceptable ? 'You won!' : 'You lost!') + ' The word was: ' + word;
  };

export const wordleCommandDetails: CodeyCommandDetails = {
  name: 'wordle',
  aliases: ['wd'],
  description: 'Play a random Wordle game to win some Codey coins!',
  detailedDescription: `**Examples:**
\`${container.botPrefix}wordle\`
\`${container.botPrefix}wd\``,
  options: [],
  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Playing wordle game...',
  executeCommand: wordleExecuteCommand,
  messageIfFailure: 'Could not play the game',
  subcommandDetails: {},
};
