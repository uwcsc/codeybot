/**
 * Formats a duration in milliseconds into English text.
 * @param duration - The duration in milliseconds
 * @param style - The style to format the duration in
 * @returns The formatted duration
 */
export const formatDuration = (duration: number, style = DurationStyle.For): string => {
  if (duration === Infinity) return 'indefinitely';

  duration = Math.round(duration / 1000);

  if (duration < 0) {
    const core = _formatDuration(-duration);
    if (style === DurationStyle.Blank) return `negative ${core}`;
    if (style === DurationStyle.For) return `for negative ${core}`;
    if (style === DurationStyle.Until) return `until ${core} ago`;
  }

  if (duration === 0) {
    if (style === DurationStyle.Blank) return 'no time';
    if (style === DurationStyle.For) return 'for no time';
    if (style === DurationStyle.Until) return 'until right now';
  }

  const core = _formatDuration(duration);
  if (style === DurationStyle.Blank) return core;
  if (style === DurationStyle.For) return `for ${core}`;
  if (style === DurationStyle.Until) return `until ${core} from now`;

  return '??';
};

function _formatDuration(duration: number): string {
  if (duration === Infinity) return 'indefinitely';

  const parts: string[] = [];

  for (const [name, scale] of formatTimescales) {
    if (duration >= scale) {
      const amount = Math.floor(duration / scale);
      duration %= scale;

      parts.push(`${amount} ${name}${amount === 1 ? '' : 's'}`);
    }
  }

  return parts.join(' ');
}

export enum DurationStyle {
  Blank,
  For,
  Until,
}

const formatTimescales: [string, number][] = [
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];
