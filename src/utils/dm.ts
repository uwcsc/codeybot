import { User } from 'discord.js';
import { logger } from '../logger/default';

export const sendMessage = async (discordUser: User, message: string): Promise<void> => {
  try {
    await discordUser.send(message);
  } catch (err) {
    logger.error({
      event: 'client_error',
      where: 'dm sendMessage',
    });
    logger.error(err);
  }
};
