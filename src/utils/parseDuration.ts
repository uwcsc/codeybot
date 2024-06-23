/**
 * Parses English text into a duration in milliseconds. Works for long for (1 day,
 * 3 weeks 2 hours) and short form (1d, 3w2h).
 *
 * @param text - The text to parse
 * @returns The duration in milliseconds or null if invalid
 */
export const parseDuration = (text: string): number | null => {
  const match = text.match(
    /^(\d+\s*w(eeks?)?\s*)?(\d+\s*d(ays?)?\s*)?(\d+\s*h((ou)?rs?)?\s*)?(\d+\s*m(in(ute)?s?)?\s*)?(\d+\s*s(ec(ond)?s?)?\s*)?$/,
  );

  if (!match) return null;

  let duration = 0;

  for (const [index, scale] of parseTimescales) {
    const submatch = match[index]?.match(/\d+/);
    if (submatch) duration += parseInt(submatch[0]) * scale;
  }

  return duration;
};

const parseTimescales = [
  [1, 604800000],
  [3, 86400000],
  [5, 3600000],
  [8, 60000],
  [11, 1000],
];
