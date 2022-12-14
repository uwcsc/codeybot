/**
 * Returns the plural form of a word. Note this only works for adding an s for now,
 * in the future we may need to detect different types in this function
 * e.g: goose -> geese
 *
 * @param singularWord - The word in singular form
 * @param count - The count that the word is referring to
 * @returns Either the singular or plural form, dependent on the count
 */
export const pluralize = (singularWord: string, count: number): string => {
  if (count > 1 || count == 0) {
    return singularWord + 's';
  }
  return singularWord;
};
