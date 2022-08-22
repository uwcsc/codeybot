import { Client, Emoji } from 'discord.js';

const emojiList: { [key: string]: Emoji } = {};

export const initEmojis = (client: Client): void => {
  client.emojis.cache.forEach((emoji) => {
    if (emoji.name) emojiList[emoji.name] = emoji;
  });
};

export const getEmojiByName = (name: string): Emoji | undefined => {
  return emojiList[name];
};

export const getCoinEmoji = (): Emoji | string => {
  let emoji: Emoji | string = emojiList['codeyCoin'];
  if (emoji === undefined) emoji = '🪙';
  return emoji;
};
