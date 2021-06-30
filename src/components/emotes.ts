import { Emoji } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';

export const emoteList: { [key: string]: Emoji } = {};

export const initEmotes = (client: CommandoClient): void => {
  client.emojis.cache.forEach((emoji) => (emoteList[emoji.name] = emoji));
};
