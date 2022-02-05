import { Message } from 'discord.js';
import { applyBonusByUserId } from './coin';
import { client } from '../bot';
import { TextChannel } from 'discord.js';
import { logError } from './logger';
import { vars } from '../config';

const PC_CATEGORY_ID: string = vars.PC_CATEGORY_ID;
const HONEYPOT_CHANNEL_ID: string = vars.HONEYPOT_CHANNEL_ID;

/*
 * Detect spammers/trolls/people who got hacked, not by the honeypot method, by
 * detecting that the message contains a ping and punishable word, and is sent
 * in the Discord server, not in the PC category
 */
const detectSpammersAndTrollsNotByHoneypot = (message: Message): boolean => {
  // Pings that would mention many people in the Discord server
  const pingWords = ['@everyone', '@here'];
  // Keywords that point towards the user being a spammer/troll/someone who got hacked
  const punishableWords = ['http', 'nitro'];
  return (
    pingWords.some((word) => message.content.includes(word)) &&
    punishableWords.some((word) => message.content.toLowerCase().includes(word)) &&
    message.channel instanceof TextChannel &&
    message.channel.parentID !== PC_CATEGORY_ID
  );
};

/*
 * Punish spammers/trolls/people who got hacked
 * Return true if someone of this kind is detected, false otherwise
 */
const punishSpammersAndTrolls = async (message: Message): Promise<boolean> => {
  if (detectSpammersAndTrollsNotByHoneypot(message) || message.channel.id === HONEYPOT_CHANNEL_ID) {
    // Delete the message, and kick the member if they are still in the server
    try {
      await message.delete();
      await message.member?.kick('Spammer/troll/got hacked');
    } catch (err) {
      logError(err as Error);
    }
    return true;
  }
  return false;
};

export const messageListener = async (message: Message): Promise<void> => {
  if (await punishSpammersAndTrolls(message)) {
    return;
  }

  if (!client.user) {
    return;
  }

  // Ignore all messages created by the bot and dms from users
  if (message.author.id != client.user.id && message.channel instanceof TextChannel) {
    await applyBonusByUserId(message.author.id);
  }
};
