import { Colors, GuildMember, Role, RoleManager, User } from 'discord.js';
import { container } from '@sapphire/framework';
import { vars } from '../config';
import { CodeyUserError } from '../codeyUserError';

const TARGET_GUILD_ID: string = vars.TARGET_GUILD_ID;

export const addOrRemove = {
  add: true,
  remove: false,
};

const createRole = async (roleName: string, roles: RoleManager): Promise<Role> => {
  try {
    // create role object
    const role = {
      name: roleName,
      color: 'Grey' as keyof typeof Colors,
      reason: `AUTOMATED: Creating the role ${roleName}.`,
    };
    return await roles.create(role);
  } catch (err) {
    throw new CodeyUserError(undefined, `Failed to create the role ${roleName}: ${err}`);
  }
};

export const updateMemberRole = async (
  member: GuildMember,
  roleName: string,
  add: boolean,
): Promise<void> => {
  let role = (await member.guild.roles.fetch()).find((role) => role.name === roleName);
  try {
    if (add) {
      // check if role exists, if not, then create it
      if (!role) {
        role = await createRole(roleName, member.guild.roles);
      }
      // add role to user
      await member.roles.add(role);
    } else if (role) {
      // remove role from user
      await member.roles.remove(role);
    }
  } catch (err) {
    throw new CodeyUserError(
      undefined,
      `Failed to ${add ? 'add' : 'remove'} the role ${roleName} ${add ? 'to' : 'from'} user ${
        member.user.tag
      } (${member.id}).`,
    );
  }
};

/*
 * Given a role id, returns a list of users that have that role
 */
export const loadRoleUsers = async (roleId: string): Promise<User[]> => {
  const userList = (await loadRoleMembers(roleId)).map((member) => member.user);

  return userList;
};

/*
 * Given a role id, returns a list of members that have that role
 */
export const loadRoleMembers = async (roleId: string): Promise<GuildMember[]> => {
  const { client } = container;

  // fetches all the members in the server and then filters based on the role
  const memberList = (await (await client.guilds.fetch(TARGET_GUILD_ID)).members.fetch())
    .map((member, _) => member)
    .filter((member) => member.roles.cache.has(roleId));

  return memberList;
};

/*
 * Given a role id, returns the role name
 */
export const getRoleName = async (roleId: string): Promise<string> => {
  const { client } = container;

  const role = (await client.guilds.fetch(TARGET_GUILD_ID)).roles.cache.find(
    (role) => role.id == roleId,
  );
  if (!role) {
    throw new CodeyUserError(undefined, 'Role does not exist');
  } else {
    return role.name;
  }
};
