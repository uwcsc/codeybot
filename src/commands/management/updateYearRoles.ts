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
  console.log(vars)
  const ALUMNI_ROLE_ID: string = vars.ALUMNI_ROLE_ID;
  const { client } = container;
  const LAST_YEAR = (new Date().getFullYear() - 1).toString();
  const guild = await client.guilds.fetch(vars.TARGET_GUILD_ID);
  const lastYearRole = guild.roles.cache.find((role: Role) => role.name === LAST_YEAR);
  if (!lastYearRole) return 'Last years Role was not found';
  const graduatingMembers = (await guild.members.fetch())?.filter((member) => member.roles.cache.has(lastYearRole.id));
  graduatingMembers.each(async (member) => {
    console.log(member.roles.add);
    await member.roles.add(ALUMNI_ROLE_ID);
  });
  await guild.roles.delete(lastYearRole.id);
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
