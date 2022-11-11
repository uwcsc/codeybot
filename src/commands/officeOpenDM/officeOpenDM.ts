import { container } from '@sapphire/framework';
import { GuildMember, User } from 'discord.js';
import { logger } from '../../logger/default';
import { loadRoleUsers } from '../../utils/roles';
import { vars } from '../../config';
import { sendMessage } from '../../utils/dm';

const OFFICE_PING_ROLE_ID: string = vars.OFFICE_PING_ROLE_ID;
const TARGET_GUILD_ID: string = vars.TARGET_GUILD_ID;

export const alertUsers = async (): Promise<void> => {
  const { client } = container;

  const users: User[] = await loadRoleUsers(OFFICE_PING_ROLE_ID);

  //send out messages
  users.forEach(async (user) => {
    await sendMessage(user, 'The office is now open!');
  });
};
