import { Message } from 'discord.js';
import { applyBonusByUserId } from './coin';
import { client } from '../bot';
import { TextChannel } from 'discord.js';

export const messageListener = async (message: Message): Promise<void> => {
  if (!client.user) {
    return;
  }

  // Ignore all messages created by the bot and dms from users
  if (message.author.id != client.user.id && message.channel instanceof TextChannel) {
    await applyBonusByUserId(message.author.id);
  }
};
