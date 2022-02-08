import { Message, DMChannel } from 'discord.js';
import { applyBonusByUserId } from './coin';
import { client } from '../bot';
import { logError } from './logger';
import { sendKickEmbed } from '../utils/embeds';
import { vars } from '../config';

const HONEYPOT_CHANNEL_ID: string = vars.HONEYPOT_CHANNEL_ID;
const ANNOUNCEMENTS_CHANNEL_ID: string = vars.ANNOUNCEMENTS_CHANNEL_ID;

/*
 * Detect spammers/trolls/people who got hacked, not by the honeypot method, by
 * detecting that the message contains a ping and punishable word, and is sent
 * in a public channel of the Discord server that is not the announcements channel
 */
const detectSpammersAndTrollsNotByHoneypot = (message: Message): boolean => {
  // Pings that would mention many people in the Discord server
  const pingWords = ['@everyone', '@here'];
  // Keywords that point towards the user being a spammer/troll/someone who got hacked
  const punishableWords = ['http', 'nitro'];
  return (
    pingWords.some((word) => message.content.includes(word)) &&
    punishableWords.some((word) => message.content.toLowerCase().includes(word)) &&
    !(message.channel instanceof DMChannel) &&
    message.channel.permissionsFor(message.channel.guild.roles.everyone)!.has('VIEW_CHANNEL') &&
    message.channel.id !== ANNOUNCEMENTS_CHANNEL_ID
  );
};

/*
 * Punish spammers/trolls/people who got hacked
 * Return true if someone of this kind is detected, false otherwise
 */
const punishSpammersAndTrolls = async (message: Message): Promise<boolean> => {
  if (detectSpammersAndTrollsNotByHoneypot(message) || message.channel.id === HONEYPOT_CHANNEL_ID) {
    // Delete the message, and if the user is still in the server, then kick them and log it
    await message.delete();
    if (message.member) {
      const user = message.member.user;
      const reason = 'Spammer/troll/got hacked';
      let isSuccessful = true;
      try {
        await message.member.kick(reason);
      } catch (err) {
        isSuccessful = false;
        logError(err as Error);
      }
      await sendKickEmbed(message, user, reason, isSuccessful);
    }
    return true;
  }
  return false;
};

export const messageListener = async (message: Message): Promise<void> => {
  if (!client.user) {
    return;
  }

  // Ignore all messages created by the bot itself
  if (message.author.id === client.user.id) {
    return;
  }

  if (await punishSpammersAndTrolls(message)) {
    return;
  }

  // Ignore DMs; include channels of type TextChannel (regular text channel) and NewsChannel (announcements channel)
  if (!(message.channel instanceof DMChannel)) {
    await applyBonusByUserId(message.author.id);
  }
};
