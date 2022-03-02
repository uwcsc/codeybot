import { Emoji } from 'discord.js';
import { SapphireClient } from '@sapphire/framework';

const emojiList: { [key: string]: Emoji } = {};

export const initEmojis = (client: SapphireClient): void => {
  client.emojis.cache.forEach((emoji) => {
    if (emoji.name) emojiList[emoji.name] = emoji;
  });
};

export const getEmojiByName = (name: string): Emoji | undefined => {
  return emojiList[name];
};
