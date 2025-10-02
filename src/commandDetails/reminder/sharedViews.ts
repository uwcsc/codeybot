import { SapphireMessageExecuteType, SapphireMessageResponse } from '../../codeyCommand';
import * as reminderComponents from '../../components/reminder/reminder';
import { ChatInputCommandInteraction, Client, Message } from 'discord.js';

const getUser = (messageFromUser: Message | ChatInputCommandInteraction) => {
  return 'user' in messageFromUser ? messageFromUser.user : messageFromUser.author;
};

export const genericViewResponse = async (
  _client: Client,
  messageFromUser: any,
  args: any,
  is_reminder: boolean = true,
): Promise<SapphireMessageResponse> => {
  const user = getUser(messageFromUser);

  let list = is_reminder
    ? await reminderComponents.getReminders(user.id)
    : await reminderComponents.getTimers(user.id);

  const itemType = is_reminder ? 'reminders' : 'timers';
  const itemTypeCapitalized = is_reminder ? 'Reminders' : 'Timers';
  const emoji = is_reminder ? '📝' : '⏰';

  console.log(`Fetching ${itemType} for user:`, user.id);

  if (!list || list.length === 0) {
    return `📭 You have no ${itemType} set.`;
  }

  let response = `${emoji} **Your ${itemTypeCapitalized}:**\n\n`;

  list.forEach((item, index) => {
    // Parse the ISO date string
    const reminderDate = new Date(item.reminder_at);
    const createdDate = new Date(item.created_at);

    // Format dates nicely
    const reminderFormatted = reminderDate.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const createdFormatted = createdDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Calculate time until reminder/timer
    const now = new Date();
    const timeDiff = reminderDate.getTime() - now.getTime();
    let timeUntil = '';

    if (timeDiff > 0) {
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        timeUntil = `⏳ In ${days}d ${hours}h`;
      } else if (hours > 0) {
        timeUntil = `⏳ In ${hours}h ${minutes}m`;
      } else {
        timeUntil = `⏳ In ${minutes}m`;
      }
    } else {
      timeUntil = `🔴 **OVERDUE**`;
    }

    response += `**${index + 1}.** ${item.message}\n`;
    response += `📅 **When:** ${reminderFormatted}\n`;
    response += `${timeUntil}\n`;
    response += `📝 *Created: ${createdFormatted}*\n\n`;
  });

  return response;
};
