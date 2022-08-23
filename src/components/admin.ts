import { GuildMember, Message } from 'discord.js';
import { logger } from '../logger/default';
import { vars } from '../config';

const USER_ID_OF_MOD_FOR_APPEAL: string = vars.USER_ID_OF_MOD_FOR_APPEAL;

/* Make ban message */
const makeBanMessage = (reason: string, days?: number): string =>
  `
Uh oh, you have been banned from the UW Computer Science server ${
    days ? `for ${days} days` : ``
  }for the following reason:

> ${reason}

If you believe you have been wrongfully banned or wish to appeal your ban, please DM <@${USER_ID_OF_MOD_FOR_APPEAL}> with
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
    isSuccessful = false;
    logger.error({
      event: 'client_error',
      error: (err as Error).toString(),
    });
  }
  return isSuccessful;
};
