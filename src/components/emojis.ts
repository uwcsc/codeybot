import { Emoji } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';

let client: CommandoClient;

export const initEmojis = (cli: CommandoClient): void => {
  client = cli;
};

export const getEmojiByName = (name: string): Emoji | undefined => {
  return client.emojis.cache.find((emoji) => emoji.name === name);
};
