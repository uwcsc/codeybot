import { Message } from 'discord.js';
import { applyBonusByUserId } from './coin';
import { client } from '../bot';

const DM = 'dm';

export const messageListener = async (message: Message): Promise<void> => {
  if (!client.user) {
    return;
  }

  // Ignore all messages created by the bot and dms from users
  if (message.author.id != client.user.id && message.channel.type !== DM) {
    await applyBonusByUserId(message.author.id);
  }
};
