import { container } from '@sapphire/framework';
import { Emoji } from 'discord.js';

const emojiList: { [key: string]: Emoji } = {};

export const initEmojis = (): void => {
  const { client } = container;
  client.emojis.cache.forEach((emoji) => {
    if (emoji.name) emojiList[emoji.name] = emoji;
  });
};

export const getEmojiByName = (name: string): Emoji | undefined => {
  return emojiList[name];
};
