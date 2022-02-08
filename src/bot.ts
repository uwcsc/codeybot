import dotenv from 'dotenv';
dotenv.config();

import '@sapphire/plugin-logger/register';
import * as colorette from 'colorette';
import { inspect } from 'util';
import Discord from 'discord.js';

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { vars } from './config';

const NOTIF_CHANNEL_ID = vars.NOTIF_CHANNEL_ID;
const BOT_PREFIX = '.';

// Set default inspection depth
inspect.defaultOptions.depth = 2;

// Enable colorette
colorette.createColors({ useColor: true });

export const client = new SapphireClient({
  defaultPrefix: BOT_PREFIX,
  caseInsensitiveCommands: true,
  logger: {
    level: LogLevel.Debug
  },
  shards: 'auto',
  intents: [
    'GUILDS',
    'GUILD_MEMBERS',
    'GUILD_BANS',
    'GUILD_EMOJIS_AND_STICKERS',
    'GUILD_VOICE_STATES',
    'GUILD_MESSAGES',
    'GUILD_MESSAGE_REACTIONS',
    'DIRECT_MESSAGES',
    'DIRECT_MESSAGE_REACTIONS'
  ]
});

export const startBot = async (): Promise<void> => {
  client.once('ready', async () => {
    // log bot init event and send system notification
    client.logger.info({
      event: 'init'
    });
    const notif = (await client.channels.fetch(NOTIF_CHANNEL_ID)) as Discord.TextChannel;
    notif.send('Codey is up!');
  });

  client.on('error', client.logger.error);

  client.login();
};
