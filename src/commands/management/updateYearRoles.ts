import {
  CodeyCommand,
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';
import { container, Command } from '@sapphire/framework';
import { vars } from '../../config';
import { Message, Role } from 'discord.js';


const executeCommand: SapphireMessageExecuteType = async (): Promise<SapphireMessageResponse> => {
  const ALUMNI_ROLE_ID: string = vars.ALUMNI_ROLE_ID;
  const { client } = container;
  const LAST_YEAR = (new Date().getFullYear() - 1).toString();
  const MIN_YEAR = (new Date().getFullYear() - 3).toString();
  const guild = await client.guilds.fetch(vars.TARGET_GUILD_ID);
  const graduatingRoles = guild.roles.cache.filter((role: Role) => role.name.isInteger() && role.name <= LAST_YEAR);
  const rolesToBeDeleted = guild.roles.cache.filter((role: Role) => role.name.isInteger() && role.name <= MIN_YEAR);
  if (!graduatingRoles) return 'Last years Role was not found';
  const graduatingMembers = (await guild.members.fetch())?.filter((member) => member.roles.cache.filter(role => graduatingRoles.has(role)).length);
  graduatingMembers.each(async (member) => {
    await member.roles.add(ALUMNI_ROLE_ID);
  });
  rolesToBeDeleted.each(async (role) => {
    await guild.roles.delete(role.id);
  });
  return "Year Roles Have been updated :)";
};

const commandDetails: CodeyCommandDetails = {
  name: 'updateYearRoles',
  aliases: [],
  description:
    'Prunes the the year roles which are more than 4 years ago and sets the role Alumni to whoever has their year set as this year.',
  detailedDescription: '',
  isCommandResponseEphemeral: true,
  executeCommand: executeCommand,
  options: [],
  subcommandDetails: {}
};

export class UpdateYearRoles extends CodeyCommand {
  details = commandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      name: 'updateYearRoles',
      description: ''
    });
  }
}
