import { ColorResolvable, GuildMember, Role, RoleManager } from 'discord.js';

export const addOrRemove = {
  add: true,
  remove: false,
};

const createRole = async (roleName: string, roles: RoleManager): Promise<Role> => {
  try {
    // create role object
    const role = {
      name: roleName,
      color: 'GREY' as ColorResolvable,
      reason: `AUTOMATED: Creating the role ${roleName}.`,
    };
    return await roles.create(role);
  } catch (err) {
    throw new Error(`Failed to create the role ${roleName}: ${err}`);
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
    throw new Error(
      `Failed to ${add ? 'add' : 'remove'} the role ${roleName} ${add ? 'to' : 'from'} user ${
        member.user.tag
      } (${member.id}).`,
    );
  }
};
