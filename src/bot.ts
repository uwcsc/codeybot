import dotenv from 'dotenv';
dotenv.config();

import { TextChannel } from 'discord.js';
import yaml from 'js-yaml';
import fs from 'fs';
import Commando, { CommandoGuild } from 'discord.js-commando';
import path from 'path';

import { openCommandoDB } from './components/db';
import logger, { logError } from './components/logger';
import onMessage from './events/message';
import onGuildMemberAdd from './events/guildMemberAdd';
import onVoiceStateUpdate from './events/voiceStateUpdate';
import { initEmojis } from './components/emojis';
import { initBootcamp } from './components/bootcamp';
import { createSuggestionCron, waitingRoomsInfo, mentorCallTimer } from './components/cron';

const NOTIF_CHANNEL_ID: string = process.env.NOTIF_CHANNEL_ID || '.';
const BOOTCAMP_GUILD_ID: string = process.env.BOOTCAMP_GUILD_ID || '.';
const BOT_TOKEN: string = process.env.BOT_TOKEN || '.';
const BOT_PREFIX = '.';

// initialize Commando client
const botOwners = yaml.load(fs.readFileSync('config/owners.yml', 'utf8')) as string[];
export const client = new Commando.Client({
  owner: botOwners,
  commandPrefix: BOT_PREFIX,
  restTimeOffset: 0
});

// register command groups

client.registry
  .registerDefaultTypes()
  .registerDefaultGroups()
  .registerDefaultCommands({ unknownCommand: false })
  .registerGroups([
    ['suggestions', 'Suggestions'],
    ['interviews', 'Mock Interviews'],
    ['bootcamp', 'Drop-in Mentorship Event'],
    ['coin', 'Codey Coin'],
    ['fun', 'Fun'],
    ['games', 'Games']
  ])
  .registerCommandsIn(path.join(__dirname, 'commands'));
// set DB provider for persisting bot config
client.setProvider(openCommandoDB().then((db) => new Commando.SQLiteProvider(db))).catch(console.error);

export const startBot = async (): Promise<void> => {
  client.once('ready', async () => {
    // log bot init event and send system notification
    logger.info({
      event: 'init'
    });

    const notif = (await client.channels.fetch(NOTIF_CHANNEL_ID)) as TextChannel;

    initEmojis(client);
    createSuggestionCron(client).start();

    // Intialize Bootcamp features if the event server exists
    const nonBootcampServers = client.guilds.cache.filter((guild) => guild.id !== BOOTCAMP_GUILD_ID);
    nonBootcampServers.forEach((guild) => {
      const commandoGuild = <CommandoGuild>guild;
      commandoGuild.setGroupEnabled('bootcamp', false);
    });
    let bootcamp;
    try {
      bootcamp = await client.guilds.fetch(BOOTCAMP_GUILD_ID);
    } catch (error) {
      console.log('No bootcamp server.');
    }
    if (bootcamp) {
      client?.user?.setActivity('Bootcamp!', { type: 'WATCHING' });
      initBootcamp(client);
      waitingRoomsInfo(client).start();
      mentorCallTimer(client).start();
    }

    notif.send('Codey is up!');
  });

  client.on('error', logError);

  client.login(BOT_TOKEN);

  client.on('message', onMessage);

  client.on('guildMemberAdd', onGuildMemberAdd);

  client.on('voiceStateUpdate', onVoiceStateUpdate);
};
