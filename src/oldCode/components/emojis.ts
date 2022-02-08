import { Emoji } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';

const emojiList: { [key: string]: Emoji } = {};

export const initEmojis = (client: CommandoClient): void => {
  client.emojis.cache.forEach((emoji) => (emojiList[emoji.name] = emoji));
};

export const getEmojiByName = (name: string): Emoji | undefined => {
  return emojiList[name];
};
