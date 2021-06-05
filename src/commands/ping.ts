// Codey ping Command

import Discord from 'discord.js';

export const pingCmd = async (message: Discord.Message) => {
  message.channel.send('pong');
};
