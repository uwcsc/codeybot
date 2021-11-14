import { Message } from 'discord.js';
import { applyBonusByUserId } from './coin';
const BOT_AUTHOR_ID: string = process.env.BOT_AUTHOR_ID || '.';

export const messageListener = async (message: Message): Promise<void> => {
  if (message.author.id != BOT_AUTHOR_ID) {
    await applyBonusByUserId(message.author.id);
  }
};
