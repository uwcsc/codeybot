import { CodeyUserError } from './../../codeyUserError';
import { container } from '@sapphire/framework';
import { PermissionsBitField, User, GuildMemberManager } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
} from '../../codeyCommand';
import { banUser } from '../../components/admin';
import { vars } from '../../config';

// Ban a user
const banExecuteCommand: SapphireMessageExecuteType = async (client, messageFromUser, args) => {
  try {
    if (
      !(<Readonly<PermissionsBitField>>messageFromUser.member?.permissions).has(
        PermissionsBitField.Flags.BanMembers,
      )
    ) {
      throw new CodeyUserError(messageFromUser, `You do not have permission to use this command.`);
    }
    const user = <User>args['user'];
    if (!user) {
      throw new CodeyUserError(messageFromUser, 'please enter a valid user mention or ID');
    }
    const reason = <string>args['reason'];
    if (!reason) {
      throw new CodeyUserError(
        messageFromUser,
        'please enter a valid reason why you are banning the user.',
      );
    }
    const days = <number>args['days'];
    // get Guild object corresponding to server
    const guild = await client.guilds.fetch(vars.TARGET_GUILD_ID);
    if (await banUser(guild, user, reason, days)) {
      return `Successfully banned user ${user.tag} (id: ${user.id}) ${
        days ? `and deleted their messages in the past ${days} days ` : ``
      }for the following reason: ${reason}`;
    } else {
      throw new CodeyUserError(
        messageFromUser,
        `There was an error banning user ${user.tag} (id: ${user.id}) - check logs for more details.`,
      );
    }
  } catch (e) {
    if (e instanceof CodeyUserError) {
      e.sendToUser();
    }
  }
};

export const banCommandDetails: CodeyCommandDetails = {
  name: 'ban',
  aliases: [],
  description: 'Ban a user.',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}ban @jeff spam\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Banning user...',
  executeCommand: banExecuteCommand,
  options: [
    {
      name: 'user',
      description: 'The user to ban.',
      type: CodeyCommandOptionType.USER,
      required: true,
    },
    {
      name: 'reason',
      description: 'The reason why we are banning the user.',
      type: CodeyCommandOptionType.STRING,
      required: true,
    },
    {
      name: 'days',
      description: "Messages in last 'days' days from user are deleted. Default is 0 days.",
      type: CodeyCommandOptionType.INTEGER,
      required: false,
    },
  ],
  subcommandDetails: {},
};
