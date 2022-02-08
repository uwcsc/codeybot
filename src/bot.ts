import dotenv from 'dotenv';
dotenv.config();

import '@sapphire/plugin-logger/register';
import * as colorette from 'colorette';
import { inspect } from 'util';

import { LogLevel, SapphireClient } from '@sapphire/framework';
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
  client.on('error', client.logger.error);

  client.login();
};
