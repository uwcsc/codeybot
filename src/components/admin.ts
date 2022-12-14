import { GuildMember } from 'discord.js';
import { vars } from '../config';
import { logger } from '../logger/default';

const MOD_USER_ID_FOR_BAN_APPEAL: string = vars.MOD_USER_ID_FOR_BAN_APPEAL;

/* Make ban message */
const makeBanMessage = (reason: string, days?: number): string =>
  `
Uh oh, you have been banned from the UW Computer Science Club server ${
    days ? `and deleted their messages in the past ${days} days ` : ``
  }for the following reason:

> ${reason}

If you believe you have been wrongfully banned and wish to appeal your ban, please DM <@${MOD_USER_ID_FOR_BAN_APPEAL}> with \
a reason why you think you should be unbanned.
`;

/* Ban a user, returns whether ban was successful */
export const banUser = async (
  member: GuildMember,
  reason: string,
  days?: number,
): Promise<boolean> => {
  let isSuccessful = false;
  try {
    const user = member.user;
    await user.send(makeBanMessage(reason, days));
    await member.ban({ reason, days });
    isSuccessful = true;
  } catch (err) {
    logger.error({
      event: 'client_error',
      error: (err as Error).toString(),
    });
  }
  return isSuccessful;
};
