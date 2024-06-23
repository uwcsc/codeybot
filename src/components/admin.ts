import { Guild, User } from 'discord.js';
import { vars } from '../config';
import { logger } from '../logger/default';
import { DurationStyle, formatDuration } from '../utils/formatDuration.js';

const MOD_USER_ID_FOR_BAN_APPEAL: string = vars.MOD_USER_ID_FOR_BAN_APPEAL;

/* Make ban message */
const makeBanMessage = (reason: string, duration?: number): string =>
  `
Uh oh, you have been banned from the UW Computer Science Club server ${
    duration
      ? `and your messages in the past ${formatDuration(
          duration,
          DurationStyle.Blank,
        )} have been deleted `
      : ''
  }for the following reason:

> ${reason}

If you believe you have been wrongfully banned and wish to appeal your ban, please DM <@${MOD_USER_ID_FOR_BAN_APPEAL}> with \
a reason why you think you should be unbanned.
`;

/* Ban a user, returns whether ban was successful */
// Bans user from guild even if they are not in server
// makeBanMessage is only sent to User if they are in server (in Discord, you cannot send direct messages to users who are not in any mutual servers)
export const banUser = async (
  guild: Guild,
  user: User,
  reason: string,
  duration?: number,
): Promise<boolean> => {
  let isSuccessful = false;
  try {
    try {
      await user.send(makeBanMessage(reason, duration));
    } catch (err) {
      logger.error({
        event: "Can't send message to user not in server",
        error: (err as Error).toString(),
      });
    }
    await guild.members.ban(user, {
      reason: reason,
      deleteMessageSeconds: duration === undefined ? 0 : Math.floor(duration / 1000),
    });
    isSuccessful = true;
  } catch (err) {
    logger.error({
      event: 'client_error',
      error: (err as Error).toString(),
    });
  }
  return isSuccessful;
};
