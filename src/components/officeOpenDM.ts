import { User } from 'discord.js';
import { loadRoleUsers } from '../utils/roles';
import { vars } from '../config';
import { sendMessage } from '../utils/dm';

const OFFICE_PING_ROLE_ID: string = vars.OFFICE_PING_ROLE_ID;

/* alertUsers
 *  loads all the users that have the "Office Ping" role using roles.ts in utils
 *  and sends them a message using sendMessage from dm.ts
 */
export const alertUsers = async (): Promise<void> => {
  const users: User[] = await loadRoleUsers(OFFICE_PING_ROLE_ID);

  users.forEach(async (user) => {
    await sendMessage(user, 'The office is now open!');
  });
};
