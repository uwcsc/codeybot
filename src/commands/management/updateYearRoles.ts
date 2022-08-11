import {
  CodeyCommand,
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse
} from '../../codeyCommand';
import { container, Command } from '@sapphire/framework';
import { vars } from '../../config';
import { Message } from 'discord.js';

const executeCommand: SapphireMessageExecuteType = async (
  client,
  messageFromUser
): Promise<SapphireMessageResponse> => {
  const LAST_YEAR = (new Date().getFullYear() - 1).toString();
  const guild = await client.guilds.fetch(vars.TARGET_GUILD_ID);
  const lastYearRole = guild.roles.cache.find((role) => role.name === LAST_YEAR);
  if (!lastYearRole) return messageFromUser.reply('Last Years Role was not found');
  const graduatingMembers = await (await guild.members.fetch())?.filter((member) =>
    member.roles.cache.has(lastYearRole.id)
  );
  for (const member of graduatingMembers) {
    member[1].roles.add(vars.ALUMNI_ROLE_ID);
  }
  guild.roles.delete(lastYearRole.id);
  return Promise.resolve('');
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
