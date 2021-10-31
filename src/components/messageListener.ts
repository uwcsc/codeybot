import { Message } from 'discord.js';
import { applyBonusByUserId } from './coin';

export const messageListener = async (message: Message): Promise<void> => {
  await applyBonusByUserId(message.author.id);

  //if (message.author.id != '843696481826373633') {
  //  message.reply(`ur bad`);
  //}
};
