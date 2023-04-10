import { assignDecadeAndPruneYearRoles, assignAlumniRole } from '../../components/profile';
import { container } from '@sapphire/framework';
import { PermissionsBitField } from 'discord.js';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const profileGradExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  if (
    !(<Readonly<PermissionsBitField>>messageFromUser.member?.permissions).has(
      PermissionsBitField.Flags.Administrator,
    )
  ) {
    return;
  }
  await assignDecadeAndPruneYearRoles();
  assignAlumniRole();
  return 'Grad roles have been updated';
};

export const profileGradCommandDetails: CodeyCommandDetails = {
  name: 'grad',
  aliases: ['g'],
  description: 'Update Grad Roles.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}profile grad\`
  \`${container.botPrefix}profile g\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Updating Grad Roles...',
  executeCommand: profileGradExecuteCommand,
  options: [],
  subcommandDetails: {},
};
