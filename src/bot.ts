import dotenv from 'dotenv';
dotenv.config();

import Discord, { TextChannel, Role, Guild, GuildMember } from 'discord.js';
import yaml from 'js-yaml';
import fs from 'fs';
import Commando from 'discord.js-commando';
import path from 'path';

import { openCommandoDB } from './components/db';
import logger, { logError } from './components/logger';
import { initEmojis } from './components/emojis';
import { createSuggestionCron, waitingRoomsInfo, mentorCallTimer } from './components/cron';
import { CategoryChannel } from 'discord.js';

const NOTIF_CHANNEL_ID: string = process.env.NOTIF_CHANNEL_ID || '.';
const EVENT_CHANNEL_ID: string = process.env.EVENT_CHANNEL_ID || '.';
const BOT_TOKEN: string = process.env.BOT_TOKEN || '.';
const BOT_PREFIX = '.';



// BootCamp Event
// export let eventMentors: string[] = [];
export let mentorRole: string;

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
    const events = (await client.channels.fetch(EVENT_CHANNEL_ID)) as Discord.TextChannel;
    initEmojis(client);
    createSuggestionCron(client).start();
    waitingRoomsInfo(client).start();
    mentorCallTimer(client).start();

    // const mentorIdsHandles = <TextChannel>events.guild.channels.cache.find(channel => channel.name === "mentor-ids")

    // mentorIdsHandles?.messages.fetch({ limit: 100 }).then(messages => {
    //   messages.every((mesg): boolean => {
    //     eventMentors.push(mesg.content);
    //     return true
    //   })
    // }).then(
    //   () => {
    //     let parsedEventMentors: string[] = []
    //     eventMentors.forEach(chunk => {
    //       parsedEventMentors = parsedEventMentors.concat(chunk.split("\n").map(str => str.trim()))
    //     })
    //     eventMentors = parsedEventMentors;
    //   }
    // )

    const mentorGetRole = <Role>events.guild.roles.cache.find(role => role.name === "Mentor");
    mentorRole = mentorGetRole.id;

    notif.send('Codey is up!');
  });

  client.on('error', logError);

  client.login(BOT_TOKEN);

  client.on("message", message => {
    if (message.channel.id === EVENT_CHANNEL_ID) {
      message?.guild?.members.cache.find(user => user.user.tag == message.content || user.id == message.content)?.edit({
        roles: [mentorRole]
      })
    }
  })

  client.on('guildMemberAdd', member => {
    const mentorIdsHandles = <TextChannel>member.guild.channels.cache.find(channel => channel.name === "mentor-ids");
    let eventMentors: string[] = [];
    mentorIdsHandles?.messages.fetch({ limit: 100 }).then(messages => {
      messages.every((mesg): boolean => {
        eventMentors.push(mesg.content);
        return true
      })
    }).then(
      () => {
        let parsedEventMentors: string[] = []
        eventMentors.forEach(chunk => {
          parsedEventMentors = parsedEventMentors.concat(chunk.split("\n").map(str => str.trim()))
        })
        if (parsedEventMentors.includes(member.id) || parsedEventMentors.includes(member.user.tag)) {
          member.edit({
            roles: [mentorRole]
          })
        }
      }
    )
    
  });

  client.on('voiceStateUpdate', (oldMember, newMember) => {
    let guild = oldMember.guild
    let newUserChannel = newMember.channel
    let oldUserChannel = oldMember.channel

    if (newUserChannel !== null) {
      const queueChannel = <TextChannel>guild.channels.cache.filter(channel => channel.name === newUserChannel?.name.replace(/ +/g, '-').toLocaleLowerCase() + "-queue").first();
      queueChannel?.send(newMember.id)

      // console.log(newUserChannel.id, EVENT_CHANNEL_ID)
      // if (newUserChannel.id === EVENT_CHANNEL_ID) newMember.setMute(true);
    }

    if (oldUserChannel !== null) {
      const chatChannel = <TextChannel>oldUserChannel?.parent?.children.find(channel => channel.name === oldUserChannel?.name.replace(/ +/g, '-').toLocaleLowerCase() + "-vc");
      const leaver = <GuildMember>oldMember.member;

      if (chatChannel) {
        if (leaver.roles.cache.map(role => role.id).includes(mentorRole) && oldUserChannel.members.filter(member => member.roles.cache.map(role => role.id).includes(mentorRole) ).size === 0) {
          chatChannel.delete();
          oldUserChannel.delete();
        } else {
          chatChannel?.updateOverwrite(leaver, {
            VIEW_CHANNEL: false,
          });
          (async(): Promise<void> => {
            let fetched = await chatChannel.messages.fetch({limit: 100});
            // let filtered = fetched.filter((msg) => msg.content === newMember.id);
            chatChannel.bulkDelete(fetched);
          })()
        }
      }

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
