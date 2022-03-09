import dotenv from 'dotenv';
dotenv.config();

import '@sapphire/plugin-logger/register';
import * as colorette from 'colorette';
import { inspect } from 'util';
import { LogLevel, SapphireClient } from '@sapphire/framework';
export const BOT_PREFIX = '.';

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

<<<<<<< HEAD
=======
// register command groups
client.registry
  .registerDefaultTypes()
  .registerDefaultGroups()
  .registerDefaultCommands({ unknownCommand: false })
  .registerGroups([
    ['suggestions', 'Suggestions'],
    ['interviews', 'Mock Interviews'],
    ['coffeechats', 'Coffee Chats'],
    ['coin', 'Codey Coin'],
    ['fun', 'Fun'],
    ['games', 'Games'],
    ['profile', 'User Profiles']
  ])
  .registerCommandsIn(path.join(__dirname, 'commands'));
// set DB provider for persisting bot config
client.setProvider(openCommandoDB().then((db) => new Commando.SQLiteProvider(db))).catch(console.error);

>>>>>>> 74111f0 (Add user profile customizations (#173))
export const startBot = async (): Promise<void> => {
  client.on('error', client.logger.error);

  client.login();
};
