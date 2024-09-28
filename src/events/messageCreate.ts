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
import { sendKickEmbed, DEFAULT_EMBED_COLOUR } from '../utils/embeds';
import { convertPdfToPic } from '../utils/pdfToPic';
import { openDB } from '../components/db';
import { spawnSync } from 'child_process';
import { User } from 'discord.js';
import { getCoinEmoji } from '../components/emojis';
import { adjustCoinBalanceByUserId, UserCoinEvent } from '../components/coin';

const ANNOUNCEMENTS_CHANNEL_ID: string = vars.ANNOUNCEMENTS_CHANNEL_ID;
const RESUME_CHANNEL_ID: string = vars.RESUME_CHANNEL_ID;
const COUNTING_CHANNEL_ID: string = vars.COUNTING_CHANNEL_ID;
const IRC_USER_ID: string = vars.IRC_USER_ID;
const PDF_FILE_PATH = 'tmp/resume.pdf';
const HEIC_FILE_PATH = 'tmp/img.heic';
const CONVERTED_IMG_PATH = 'tmp/img.jpg';

// Variables and constants associated with the counting game
const coinsPerMessage = 0.1; // Number of coins awarded = coinsPerMessage * highest counting number * messages sent by user
const countingAuthorDelay = 1; // The minimum number of users that must count for someone to go again
const previousCountingAuthors: Array<User> = []; // Stores the most recent counters
const authorMessageCounts: Map<User, number> = new Map(); // Stores how many messages each user sent
const coinAwardNumberThreshold = 20; // The minimum number that must be reached for coins to be awarded
let currentCountingNumber = 1;

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
  const isPDF = attachment && attachment.contentType === 'application/pdf';
  const isImage =
    attachment && attachment.contentType && attachment.contentType.startsWith('image');

  // If no resume pdf is provided, nuke message and DM user about why their message got nuked
  if (!(attachment && (isPDF || isImage))) {
    const user = message.author.id;
    const channel = message.channelId;

    const mentionUser = userMention(user);
    const mentionChannel = channelMention(channel);

    const explainMessage = `Hey ${mentionUser}, we've removed your message from ${mentionChannel} since only messages with PDFs/images are allowed there. 

    If you want critiques on your resume, please attach PDF/image when sending messages in ${mentionChannel}.
    
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

  if (isPDF) {
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
  } else if (isImage) {
    let imageLink = attachment.url;

    // Convert HEIC/HEIF to JPG
    const isHEIC: boolean =
      attachment &&
      (attachment.contentType === 'image/heic' || attachment.contentType === 'image/heif');
    if (isHEIC) {
      const heicResponse = await axios.get(imageLink, { responseType: 'stream' });
      const heicContent = heicResponse.data;
      await writeFile(HEIC_FILE_PATH, heicContent);

      const convertCommand = `npx heic2jpg ${HEIC_FILE_PATH}`;

      spawnSync('sh', ['-c', convertCommand], { stdio: 'inherit' });
      spawnSync('sh', ['-c', 'mv img.jpg tmp'], { stdio: 'inherit' });

      imageLink = CONVERTED_IMG_PATH;
    }

    // Create a thread with the resume image
    const imageName = attachment.name;
    const thread = await message.startThread({
      name: imageName.length < 100 ? imageName : 'Resume',
      autoArchiveDuration: 60,
    });

    const preview_message = await thread.send({
      files: [imageLink],
    });

    // Inserting the image and preview message IDs into the DB
    await db.run(
      'INSERT INTO resume_preview_info (initial_pdf_id, preview_id) VALUES(?, ?)',
      message.id,
      preview_message.id,
    );

    return preview_message;
  }
};

const countingGameLogic = async (
  client: Client,
  message: Message,
): Promise<Message<boolean> | undefined> => {
  // Check to see if game should end
  let reasonForFailure = '';
  if (isNaN(Number(message.content))) {
    // Message was not a number
    reasonForFailure = `"${message.content}" is not a number!`;
  } else if (previousCountingAuthors.find((author) => author === message.author)) {
    // Author is still on cooldown
    reasonForFailure = `<@${message.author.id}> counted too recently!`;
  } else if (Number(message.content) != currentCountingNumber) {
    // Wrong number was sent
    reasonForFailure = `${message.content} is not the next number! The next number was ${currentCountingNumber}.`;
  }

  if (reasonForFailure) {
    return endCountingGame(client, message, reasonForFailure);
  }

  // If checks passed, continue the game
  currentCountingNumber++;
  message.react('✅');
  previousCountingAuthors.unshift(message.author); // Add current author to list of authors on cooldown
  while (previousCountingAuthors.length > countingAuthorDelay) {
    previousCountingAuthors.pop(); // Remove last author from cooldown
  }
  const currentAuthorCount: number | undefined = authorMessageCounts.get(message.author);
  authorMessageCounts.set(message.author, currentAuthorCount ? currentAuthorCount + 1 : 1);

  return;
};

const endCountingGame = async (
  client: Client,
  message: Message,
  reasonForFailure: string,
): Promise<Message<boolean> | undefined> => {
  // Builds game over embed
  const endGameEmbed = new EmbedBuilder()
    .setColor(DEFAULT_EMBED_COLOUR)
    .setTitle('Counting Game Over')
    .addFields([
      {
        name: 'Reason for Game Over',
        value: reasonForFailure,
      },
    ]);

  if (currentCountingNumber < coinAwardNumberThreshold) {
    endGameEmbed.setDescription(
      `Coins will not be awarded because the threshold, ${coinAwardNumberThreshold}, was not reached.`,
    );
  } else {
    const sortedAuthorMessageCounts: Array<[User, number]> = Array.from(authorMessageCounts).sort(
      (a, b) => b[1] - a[1],
    ); // Turns map into descending sorted array
    const coinsAwarded: Array<string> = ['**Coins awarded:**'];
    for (const pair of sortedAuthorMessageCounts) {
      pair[1] *= coinsPerMessage * currentCountingNumber; // Changes number of messages sent to number of coins awarded
      coinsAwarded.push(`<@${pair[0].id}> - ${pair[1]} ${getCoinEmoji()}`);
      await adjustCoinBalanceByUserId(message.author.id, pair[1], UserCoinEvent.Counting);
    }

    endGameEmbed.setDescription(coinsAwarded.join('\n'));
  }

  currentCountingNumber = 1;
  message.react('❌');
  previousCountingAuthors.length = 0;
  authorMessageCounts.clear();

  return await message.channel?.send({ embeds: [endGameEmbed] });
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

  if (message.channelId === COUNTING_CHANNEL_ID) {
    await countingGameLogic(client, message);
  }

  // Ignore DMs; include announcements, thread, and regular text channels
  if (message.channel.type !== ChannelType.DM) {
    await applyBonusByUserId(message.author.id);
  }
};
