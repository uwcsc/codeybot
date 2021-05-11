import dotenv = require('dotenv')
dotenv.config()

import Discord = require('discord.js')
import _ = require('lodash')

const NOTIF_CHANNEL_ID: string = process.env.NOTIF_CHANNEL_ID
const BOT_TOKEN: string = process.env.BOT_TOKEN
const BOT_PREFIX = "."

const client = new Discord.Client()

const parseCommand = message => {
    // extract arguments by splitting by spaces and grouping strings in quotes
    // e.g. .ping 1 "2 3" => ['ping', '1', '2 3']
    let args = message.content.slice(BOT_PREFIX.length).match(/[^\s"']+|"([^"]*)"|'([^']*)'/g)
    args = _.map(args, arg => {
      if (arg[0].match(/'|"/g) && arg[arg.length-1].match(/'|"/g)) {
        return arg.slice(1,arg.length-1)
      }
      return arg
    })
    const firstArg = args.shift()
    if (!firstArg) return
    const command = firstArg.toLowerCase()
    return { command, args }
}

const handleCommand = async (message, command, args) => {
    switch(command) {
        case 'ping':
            await message.channel.send('pong')
    }
}

const handleMessage = async message => {
    // ignore messages without bot prefix and messages from other bots
    if (!message.content.startsWith(BOT_PREFIX) || message.author.bot) return
    // obtain command and args from the command message
    const { command, args } = parseCommand(message)
    // TODO: log commands

    try {
        await handleCommand(message, command, args)
    } catch(e) {
        // TODO: handle error
    }
}

const startBot = async () => {
    client.once('ready', async () => {
        const notif = await client.channels.fetch(NOTIF_CHANNEL_ID) as Discord.TextChannel
        notif.send('Codey is up!')
    })

    client.on('message', handleMessage)

    client.login(BOT_TOKEN)
}

startBot()
