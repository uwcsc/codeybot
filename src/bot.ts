import dotenv from 'dotenv';
dotenv.config();

import Discord, { TextChannel, Role } from 'discord.js';
import yaml from 'js-yaml';
import fs from 'fs';
import Commando from 'discord.js-commando';
import path from 'path';

import { openCommandoDB } from './components/db';
import logger, { logError } from './components/logger';
import { initEmojis } from './components/emojis';
import { createSuggestionCron } from './components/cron';
import { CategoryChannel } from 'discord.js';

const NOTIF_CHANNEL_ID: string = process.env.NOTIF_CHANNEL_ID || '.';
const BOT_TOKEN: string = process.env.BOT_TOKEN || '.';
const BOT_PREFIX = '.';

// BootCamp Event
const eventMentors: string[] = [];

// initialize Commando client
const botOwners = yaml.load(fs.readFileSync('config/owners.yml', 'utf8')) as string[];
const client = new Commando.Client({ owner: botOwners, commandPrefix: BOT_PREFIX });
// register command groups
client.registry
  .registerDefaultTypes()
  .registerDefaultGroups()
  .registerDefaultCommands({ unknownCommand: false })
  .registerGroups([
    ['suggestions', 'Suggestions'],
    ['interviews', 'Mock Interviews'],
    ['mentor', 'Add Mentor'],
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
    const notif = (await client.channels.fetch(NOTIF_CHANNEL_ID)) as Discord.TextChannel;
    initEmojis(client);
    createSuggestionCron(client).start();
    const mentorIdsHandles = <TextChannel>notif.guild.channels.cache.find(channel => channel.name === "mentor-list")

    mentorIdsHandles.messages.fetch({ limit: 100 }).then(messages => {
      messages.every((mesg): boolean => {
        eventMentors.push(mesg.content)
        return true
      })
    })

    notif.send('Codey is ' + 'doing backflips' + '!');
  });

  client.on('error', logError);

  client.login(BOT_TOKEN);

  client.on('guildMemberAdd', member => {
    if (eventMentors.includes(member.id) || eventMentors.includes(member.user.tag)) {
      let mentorRole = <Role>member.guild.roles.cache.find(role => role.name === "Mentor");
      member.edit({
        roles: [mentorRole]
      })
    }
  });

  client.on('voiceStateUpdate', (oldMember, newMember) => {
    let guild = oldMember.guild
    let newUserChannel = newMember.channel
    let oldUserChannel = oldMember.channel

    if (newUserChannel !== null) {
      const queueChannel = <TextChannel>guild.channels.cache.filter(channel => channel.name === newUserChannel?.name.replace(/ +/g, '-').toLocaleLowerCase() + "-queue").first();
      queueChannel?.send(newMember.id)
    }

    if (oldUserChannel !== null) {
      // oldUserChannel.delete()

      const queueChannel = <TextChannel>guild.channels.cache.filter(channel => channel.name === oldUserChannel?.name.replace(/ +/g, '-').toLocaleLowerCase() + "-queue").first();

      const clear = async(): Promise<void> => {
        let fetched = await queueChannel.messages.fetch({limit: 100});
        let filtered = fetched.filter((msg) => msg.content === newMember.id);
        queueChannel.bulkDelete(filtered);
      }
      if (queueChannel) clear()
    }
  })
};

export default eventMentors;