import dotenv from 'dotenv';
dotenv.config();

import { GatewayIntentBits, Partials } from 'discord.js';
import { container, LogLevel, SapphireClient, SapphirePrefix } from '@sapphire/framework';
import '@sapphire/plugin-logger/register';
import * as colorette from 'colorette';
import { inspect } from 'util';

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
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.User]
});

container.botPrefix = client.options.defaultPrefix!;

export const startBot = async (): Promise<void> => {
  try {
    client.on('error', client.logger.error);

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
