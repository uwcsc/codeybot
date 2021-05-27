import dotenv from 'dotenv';
dotenv.config();

import Discord from 'discord.js';
import _ from 'lodash';
import { openDB, testDb } from './components/db';
import { addInterviewer, initInterview } from './components/interview';
import logger from './logger';

const NOTIF_CHANNEL_ID: string = process.env.NOTIF_CHANNEL_ID || '.';
const BOT_TOKEN: string = process.env.BOT_TOKEN || '.';
const BOT_PREFIX = '.';

const client = new Discord.Client();

const parseCommand = (message: Discord.Message): { command: string | null; args: string[] } => {
  // extract arguments by splitting by spaces and grouping strings in quotes
  // e.g. .ping 1 "2 3" => ['ping', '1', '2 3']
  let args = message.content.slice(BOT_PREFIX.length).match(/[^\s"']+|"([^"]*)"|'([^']*)'/g);
  args = _.map(args, (arg) => {
    if (arg[0].match(/'|"/g) && arg[arg.length - 1].match(/'|"/g)) {
      return arg.slice(1, arg.length - 1);
    }
    return arg;
  });
  // obtain the first argument after the prefix
  const firstArg = args.shift();
  if (!firstArg) return { command: null, args: [] };
  const command = firstArg.toLowerCase();
  return { command, args };
};

const handleCommand = async (message: Discord.Message, command: string, args: string[]) => {
  // log command and its author info
  logger.info({
    event: 'command',
    messageId: message.id,
    author: message.author.id,
    authorName: message.author.username,
    channel: message.channel.id,
    command,
    args
  });

  switch (command) {
    case 'ping':
      await message.channel.send('pong');
      break;
    case 'interviewer':
      addInterviewer(message, args);
      break;
  }

  //dev testing
  if (process.env.NODE_ENV == 'dev') {
    testDb(message, command, args);
  }
};

const handleMessage = async (message: Discord.Message) => {
  // ignore messages without bot prefix and messages from other bots
  if (!message.content.startsWith(BOT_PREFIX) || message.author.bot) return;
  // obtain command and args from the command message
  const { command, args } = parseCommand(message);
  if (!command) return;

  try {
    await handleCommand(message, command, args);
  } catch (e) {
    // log error
    logger.error({
      event: 'error',
      messageId: message.id,
      command: command,
      args: args,
      error: e
    });
  }
};

const startBot = async () => {
  client.once('ready', async () => {
    // log bot init event and send system notification
    logger.info({
      event: 'init'
    });
    const notif = (await client.channels.fetch(NOTIF_CHANNEL_ID)) as Discord.TextChannel;
    notif.send('Codey is up!');
  });
  initInterview();
  client.on('message', handleMessage);

  client.login(BOT_TOKEN);
};

startBot();
