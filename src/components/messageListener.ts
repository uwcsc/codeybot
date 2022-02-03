import { Message } from 'discord.js';
import { applyBonusByUserId } from './coin';
import { client } from '../bot';
import { TextChannel } from 'discord.js';
import { readFileSync } from 'fs';
import { logError } from './logger';

const ENV: string = process.env.NODE_ENV || 'dev';
const vars = JSON.parse(readFileSync(`./config/${ENV}/vars.json`, 'utf-8'));
const PC_CATEGORY_ID: string = vars.PC_CATEGORY_ID;
const HONEYPOT_CHANNEL_ID: string = vars.HONEYPOT_CHANNEL_ID;

export const messageListener = async (message: Message): Promise<void> => {
  // Detects spammers/trolls/people who got hacked
  const pingWords = ['@everyone', '@here'];
  const punishableWords = ['http', 'nitro'];
  if (
    (pingWords.some((word) => message.content.includes(word)) &&
      punishableWords.some((word) => message.content.toLowerCase().includes(word)) &&
      message.channel instanceof TextChannel &&
      message.channel.parentID !== PC_CATEGORY_ID) ||
    message.channel.id === HONEYPOT_CHANNEL_ID
  ) {
    // Soft bans member and deletes messages from past 1 day
    try {
      if (await message.member?.ban({ days: 1, reason: 'Spammer/troll/got hacked' })) {
        await message.guild?.members.unban(message.author.id);
      }
    } catch (err) {
      logError(err as Error);
    }
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
