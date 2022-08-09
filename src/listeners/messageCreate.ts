import { ApplyOptions } from '@sapphire/decorators';
import { container, Listener } from '@sapphire/framework';
import { Message } from 'discord.js';
import { applyBonusByUserId } from '../components/coin';
import { vars } from '../config';
import { sendKickEmbed } from '../utils/embeds';
import { convertPdfToPic } from '../utils/pdfToPic';

import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import axios from 'axios';
import { PDFDocument } from 'pdf-lib';
import { WriteImageResponse } from 'pdf2pic/dist/types/writeImageResponse';

const ANNOUNCEMENTS_CHANNEL_ID: string = vars.ANNOUNCEMENTS_CHANNEL_ID;
const RESUME_CHANNEL_ID: string = vars.RESUME_CHANNEL_ID;

/*
 * If honeypot is to exist again, then add HONEYPOT_CHANNEL_ID to the config
 * and add a check for a message's channel ID being equal to HONEYPOT_CHANNEL_ID
 */

/*
 * Detect spammers/trolls/people who got hacked, by detecting that the message
 * contains a ping and punishable word, and is sent in a public channel of the
 * Discord server that is not the announcements channel
 */
const detectSpammersAndTrolls = (message: Message): boolean => {
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
  if (detectSpammersAndTrolls(message)) {
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

/**
 * Convert any pdfs sent in the #resumes channel to an image.
 */
const convertResumePdfsIntoImages = async (message: Message): Promise<Message<boolean>> => {
  // Get resume pdf from message and write locally to tmp
  const pdfLink = Array.from(message.attachments.values()).map((file) => file.attachment)[0];
  const pdfResponse = await axios.get(pdfLink, { responseType: 'stream' });
  const pdfContent = pdfResponse.data;
  await writeFile('tmp/resume.pdf', pdfContent);

  // Get the size of the pdf
  const pdfDocument = await PDFDocument.load(readFileSync('tmp/resume.pdf'));
  const { width, height } = pdfDocument.getPage(0).getSize();

  // Convert the resume pdf into image
  const imgResponse = <WriteImageResponse>await convertPdfToPic('tmp/resume.pdf', 1, 'resume', width * 2, height * 2);

  // Send the image back to the channel
  return await message.channel.send({ files: [imgResponse.path] });
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

    // If channel is in resumes, convert the message attachment to an image
    if (message.channelId === RESUME_CHANNEL_ID) {
      await convertResumePdfsIntoImages(message);
    }

    // Ignore DMs; include announcements, thread, and regular text channels
    if (message.channel.type !== 'DM') {
      await applyBonusByUserId(message.author.id);
    }
  }
}
