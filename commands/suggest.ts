// Codey suggest Command
import Discord from 'discord.js';

export const suggestCmd = async (message: Discord.Message, command: string, args: string[]) => {
  message.channel.send('yay');
  message.channel.send('test suggestion was: ' + args.toString());

  // ack suggestion was taken
  // save suggestion into DB
};
