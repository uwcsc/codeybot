import { Message } from 'discord.js';
import { applyBonusByUserId } from './coin';

export const messageListener = (message: Message): void => {
  applyBonusByUserId(message.author.id);
};
