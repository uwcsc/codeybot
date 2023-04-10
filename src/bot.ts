import dotenv from 'dotenv';
dotenv.config();

import { GatewayIntentBits, Partials } from 'discord.js';
import { container, LogLevel, SapphireClient, SapphirePrefix } from '@sapphire/framework';
import '@sapphire/plugin-logger/register';
import * as colorette from 'colorette';
import { Message, PartialMessage } from 'discord.js';
import { inspect } from 'util';
import { initMessageCreate } from './events/messageCreate';
import { initMessageDelete } from './events/messageDelete';
import { initReady } from './events/ready';
import { logger } from './logger/default';
import { validateEnvironmentVariables } from './validateEnvVars';

// Set default inspection depth
inspect.defaultOptions.depth = 3;

// Enable colorette
colorette.createColors({ useColor: true });

const client = new SapphireClient({
  defaultPrefix: '.',
  caseInsensitiveCommands: true,
  loadMessageCommandListeners: true,
  logger: {
    level: LogLevel.Debug,
  },
  shards: 'auto',
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.Reaction,
    Partials.User,
  ],
});

container.botPrefix = client.options.defaultPrefix!;

export const startBot = async (): Promise<void> => {
  try {
    validateEnvironmentVariables();
    logger.info({
      event: 'init',
    });
    client.on('error', client.logger.error);
    // Use this on the discord.js client after sapphire
    // client.on('error', logger.error);
    client.on('ready', initReady);
    client.on('messageCreate', (message: Message) => {
      initMessageCreate(client, logger, message);
    });
    client.on('messageDelete', (message: Message | PartialMessage) => {
      initMessageDelete(message);
    });
    client.login();
  } catch (e: unknown) {
    logger.error(`Uh oh, something went wrong when initializing the bot!\n${e}`);
  }
};

// Augment Container to have the botPrefix property, since container.botPrefix is shorter than container.client.options.defaultPrefix
declare module '@sapphire/pieces' {
  interface Container {
    botPrefix: SapphirePrefix;
  }
}
