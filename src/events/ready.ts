import { blue, green, magenta, magentaBright, white } from 'colorette';
import { Client, TextChannel } from 'discord.js';
import { initCrons } from '../components/cron';
import { initEmojis } from '../components/emojis';
import { vars } from '../config';
import { logger } from '../logger/default';
import { getRepositoryReleases } from '../utils/github';

const dev = process.env.NODE_ENV !== 'production';

const NOTIF_CHANNEL_ID = vars.NOTIF_CHANNEL_ID;

const printBanner = (): void => {
  const success = green('+');

  const llc = dev ? magentaBright : white;
  const blc = dev ? magenta : blue;

  const line01 = llc('');
  const line02 = llc('');
  const line03 = llc('');

  // Offset Pad
  const pad = ' '.repeat(7);

  logger.info({
    message: String.raw`
${line01} ${pad}${blc('1.0.0')}
${line02} ${pad}[${success}] Gateway
${line03}${dev ? ` ${pad}${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}` : ''}
		`.trim(),
    where: 'printBanner',
  });
};

const sendReady = async (client: Client): Promise<void> => {
  const notif = (await client.channels.fetch(NOTIF_CHANNEL_ID)) as TextChannel;
  const latestRelease = (await getRepositoryReleases('uwcsc', 'codeybot'))[0];
  notif.send(`Codey is up! App version: ${latestRelease.tag_name}`);
};

export const initReady = (client: Client): void => {
  printBanner();
  client.user!.setActivity('CSC | .help');
  sendReady(client);
  initCrons(client);
  initEmojis(client);
};
