import axios from 'axios';
import {
  ChannelType,
  Client,
  Message,
  PermissionsBitField,
  channelMention,
  userMention,
  EmbedBuilder,
} from 'discord.js';
import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import { Logger } from 'winston';
import { applyBonusByUserId } from '../components/coin';
import { vars } from '../config';
import { sendKickEmbed } from '../utils/embeds';
import { convertPdfToPic } from '../utils/pdfToPic';
import { openDB } from '../components/db';

const ANNOUNCEMENTS_CHANNEL_ID: string = vars.ANNOUNCEMENTS_CHANNEL_ID;
const RESUME_CHANNEL_ID: string = vars.RESUME_CHANNEL_ID;
const IRC_USER_ID: string = vars.IRC_USER_ID;
const PDF_FILE_PATH = 'tmp/resume.pdf';

/*
 * If honeypot is to exist again, then add HONEYPOT_CHANNEL_ID to the config
 * and add a check for a message's channel ID being equal to HONEYPOT_CHANNEL_ID
 *permissionsFor/

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
    message.channel.type !== ChannelType.DM &&
    message.channel
      .permissionsFor(message.channel.guild.roles.everyone)
      .has(PermissionsBitField.Flags.ViewChannel) &&
    message.channel.id !== ANNOUNCEMENTS_CHANNEL_ID
  );
};

/*
 * Punish spammers/trolls/people who got hacked
 * Return true if someone of this kind is detected, false otherwise
 */
const punishSpammersAndTrolls = async (
  client: Client,
  logger: Logger,
  message: Message,
): Promise<boolean> => {
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
          error: (err as Error).toString(),
        });
      }
      await sendKickEmbed(client, message, user, reason, isSuccessful);
    }
    return true;
  }
  return false;
};

/**
 * Convert any pdfs sent in the #resumes channel to an image,
 * nuke message and DM user if no attachment is found or attachment is not PDF
 */
const convertResumePdfsIntoImages = async (
  client: Client,
  message: Message,
): Promise<Message<boolean> | undefined> => {
  const attachment = message.attachments.first();

  // If no resume pdf is provided, nuke message and DM user about why their message got nuked
  if (!attachment || attachment.contentType !== 'application/pdf') {
    const user = message.author.id;
    const channel = message.channelId;

    const mentionUser = userMention(user);
    const mentionChannel = channelMention(channel);

    const explainMessage = `Hey ${mentionUser}, we've removed your message from ${mentionChannel} since only messages with PDFs are allowed there. 

    If you want critiques on your resume, please attach a PDF when sending messages in ${mentionChannel}.
    
    If you want to make critiques on a specific resume, please go to the corresponding thread in ${mentionChannel}.`;
    const explainEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('Invalid Message Detected')
      .setDescription(explainMessage);

    await message.delete();
    await client.users.send(user, { embeds: [explainEmbed] });

    return;
  }

  const db = await openDB();

  // Get resume pdf from message and write locally to tmp
  const pdfLink = attachment.url;
  const pdfResponse = await axios.get(pdfLink, { responseType: 'stream' });
  const pdfContent = pdfResponse.data;
  await writeFile(PDF_FILE_PATH, pdfContent);

  // Get the size of the pdf
  const pdfDocument = await PDFDocument.load(readFileSync(PDF_FILE_PATH));
  const { width, height } = pdfDocument.getPage(0).getSize();
  if (pdfDocument.getPageCount() > 1) {
    return await message.channel.send('Resume must be 1 page.');
  }

  const fileMatch = pdfLink.match('[^/]*$') || ['Resume'];
  // Remove url parameters by calling `.split(?)[0]`
  const fileName = fileMatch[0].split('?')[0];
  // Convert the resume pdf into image
  const imgResponse = await convertPdfToPic(PDF_FILE_PATH, 'resume', width * 2, height * 2);
  // Send the image back to the channel as a thread
  const thread = await message.startThread({
    name: fileName.length < 100 ? fileName : 'Resume',
    autoArchiveDuration: 60,
  });
  const preview_message = await thread.send({
    files: imgResponse.map((img) => img.path),
  });
  // Inserting the pdf and preview message IDs into the DB
  await db.run(
    'INSERT INTO resume_preview_info (initial_pdf_id, preview_id) VALUES(?, ?)',
    message.id,
    preview_message.id,
  );
  return preview_message;
};

export const initMessageCreate = async (
  client: Client,
  logger: Logger,
  message: Message,
): Promise<void> => {
  // Ignore all bots including self but not IRC
  if (message.author.bot && message.author.id !== IRC_USER_ID) {
    return;
  }

  if (await punishSpammersAndTrolls(client, logger, message)) {
    return;
  }

  // If channel is in resumes, convert the message attachment to an image
  if (message.channelId === RESUME_CHANNEL_ID) {
    await convertResumePdfsIntoImages(client, message);
  }

  // Ignore DMs; include announcements, thread, and regular text channels
  if (message.channel.type !== ChannelType.DM) {
    await applyBonusByUserId(message.author.id);
  }
};
