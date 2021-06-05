// Codey ping Command

import Discord from 'discord.js';

export const pingCmd = async (message: Discord.Message): Promise<void> => {
  message.channel.send('pong');
};
