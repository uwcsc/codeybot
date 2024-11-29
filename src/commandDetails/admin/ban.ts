import { container } from '@sapphire/framework';
import { EmbedBuilder, PermissionsBitField, TextChannel, User } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  getUserFromMessage,
} from '../../codeyCommand';
import { banUser } from '../../components/admin';
import { vars } from '../../config';
import { DEFAULT_EMBED_COLOUR } from '../../utils/embeds.js';
import { DurationStyle, formatDuration } from '../../utils/formatDuration.js';
import { parseDuration } from '../../utils/parseDuration.js';
import { CodeyUserError } from './../../codeyUserError';

const NOTIF_CHANNEL_ID: string = vars.NOTIF_CHANNEL_ID;

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
    const duration = parseDuration(<string>args['duration']);

    if (duration === null) {
      throw new CodeyUserError(
        messageFromUser,
        'please enter a valid duration (e.g. 7d, 3h, 1h30m).',
      );
    }

    if (duration > 7 * 24 * 60 * 60 * 1000) {
      throw new CodeyUserError(messageFromUser, 'cannot purge more than 7 days of messages.');
    }

    // get Guild object corresponding to server
    const guild = await client.guilds.fetch(vars.TARGET_GUILD_ID);
    if (await banUser(guild, user, reason, duration)) {
      const mod = getUserFromMessage(messageFromUser);
      const banEmbed = new EmbedBuilder()
        .setTitle('Ban')
        .setColor(DEFAULT_EMBED_COLOUR)
        .addFields([
          { name: 'User', value: `${user.tag} (${user.id})` },
          {
            name: 'Banned By',
            value: `${mod.tag} (${mod.id})`,
          },
          { name: 'Reason', value: reason },
          {
            name: 'Messages Purged',
            value: !duration ? 'None' : `Past ${formatDuration(duration, DurationStyle.Blank)}`,
          },
        ]);
      (client.channels.cache.get(NOTIF_CHANNEL_ID) as TextChannel).send({
        embeds: [banEmbed],
      });
      return `Successfully banned user ${user.tag} (id: ${user.id}) ${
        duration
          ? `and deleted their messages in the past ${formatDuration(
              duration,
              DurationStyle.Blank,
            )} `
          : ``
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
      name: 'duration',
      description:
        'Messages within the specified time (e.g. 1 day, 2h30m) from user are deleted. Default 0d, max 7d.',
      type: CodeyCommandOptionType.STRING,
      required: false,
    },
  ],
  subcommandDetails: {},
};
