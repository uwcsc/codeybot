import { ApplyOptions } from '@sapphire/decorators';
import { container, Listener } from '@sapphire/framework';
import { Message } from 'discord.js';
import { applyBonusByUserId } from '../components/coin';
import { vars } from '../config';
import { sendKickEmbed } from '../utils/embeds';

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
    message.channel.type !== 'DM' &&
    message.channel.permissionsFor(message.channel.guild.roles.everyone).has('VIEW_CHANNEL') &&
    message.channel.id !== ANNOUNCEMENTS_CHANNEL_ID
  );
};

/*
 * Punish spammers/trolls/people who got hacked
 * Return true if someone of this kind is detected, false otherwise
 */
const punishSpammersAndTrolls = async (message: Message): Promise<boolean> => {
  const { logger } = container;
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
        logger.error({
          event: 'client_error',
          error: (err as Error).toString()
        });
      }
      await sendKickEmbed(message, user, reason, isSuccessful);
    }
    return true;
  }
  return false;
};

@ApplyOptions<Listener.Options>({
  event: 'messageCreate'
})
export class MessageCreateListener extends Listener {
  async run(message: Message): Promise<void> {
    const { client } = container;

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

    // Ignore DMs; include announcements, thread, and regular text channels
    if (message.channel.type !== 'DM') {
      await applyBonusByUserId(message.author.id);
    }
  }
}
