import dotenv from 'dotenv';
dotenv.config();

import { Message } from 'discord.js';
import { container, LogLevel, SapphireClient, SapphirePrefix } from '@sapphire/framework';
import '@sapphire/plugin-logger/register';
import * as colorette from 'colorette';
import { inspect } from 'util';
import { initMessageCreate } from './events/messageCreate';
import { initReady } from './events/ready';

// Set default inspection depth
inspect.defaultOptions.depth = 3;

// Enable colorette
colorette.createColors({ useColor: true });

const client = new SapphireClient({
  defaultPrefix: '.',
  caseInsensitiveCommands: true,
  loadMessageCommandListeners: true,
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
  ],
  partials: ['CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION', 'USER']
});

container.botPrefix = client.options.defaultPrefix!;

export const startBot = async (): Promise<void> => {
  try {
    client.logger.info({
      event: 'init'
    });
    client.on('error', client.logger.error);
    client.on('ready', initReady);
    client.on('messageCreate', (message: Message) => {
      if (client.user) initMessageCreate(client, container.logger, message);
    });
    client.login();
  } catch (e) {
    console.log('Bot failure');
    console.log(e);
  }
};

// Augment Container to have the botPrefix property, since container.botPrefix is shorter than container.client.options.defaultPrefix
declare module '@sapphire/pieces' {
  interface Container {
    botPrefix: SapphirePrefix;
  }
}
