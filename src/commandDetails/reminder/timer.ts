import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import * as reminderComponents from '../../components/reminder/reminder';

const TIME_UNITS = {
  minutes: { multiplier: 60, singular: 'minute', plural: 'minutes' },
  hours: { multiplier: 3600, singular: 'hour', plural: 'hours' },
  days: { multiplier: 86400, singular: 'day', plural: 'days' },
} as const;

type TimeUnit = keyof typeof TIME_UNITS;

const timerExecuteCommand: SapphireMessageExecuteType = (
  _client,
  _messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  return Promise.resolve('Please use a subcommand: `/timer value`'); // Fixed from 'set' to 'value'
};

const timerSetExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const providedTimes: Array<{ unit: TimeUnit; value: number }> = [];
  let totalSeconds = 0;

  // Check each time unit
  for (const [unit, config] of Object.entries(TIME_UNITS)) {
    const value = args[unit] as number;
    if (value !== undefined && value > 0) {
      providedTimes.push({ unit: unit as TimeUnit, value });
      totalSeconds += value * config.multiplier;
    }
  }

  if (providedTimes.length === 0) {
    return Promise.resolve('Please specify at least one time duration!');
  }

  if (totalSeconds > 604800) {
    return Promise.resolve('Timer duration cannot exceed 1 week!');
  }

  const reminderMessage = (args['message'] as string) || "Time's up!";

  const timeDescription = providedTimes
    .map(({ unit, value }) => {
      const config = TIME_UNITS[unit];
      const label = value === 1 ? config.singular : config.plural;
      return `${value} ${label}`;
    })
    .join(', ');

  const user = 'author' in messageFromUser ? messageFromUser.author : messageFromUser.user;

  // Calculate the future date/time when the timer should trigger
  const now = new Date();
  const futureDateTime = new Date(now.getTime() + totalSeconds * 1000);

  try {
    // Save the timer as a reminder in the database
    await reminderComponents.addReminder(
      user.id,
      now.toISOString(),
      futureDateTime.toISOString(),
      `⏰ **Timer:** ${reminderMessage}`,
    );

    const content = `⏰ Timer set for ${timeDescription}! I'll DM you with: "${reminderMessage}"

📅 **Scheduled for:** <t:${Math.floor(futureDateTime.getTime() / 1000)}:F>`;

    return Promise.resolve(content);
  } catch (error) {
    console.error('Failed to save timer reminder:', error);
    return Promise.resolve('Failed to set timer. Please try again.');
  }
};

export const timerCommandDetails: CodeyCommandDetails = {
  name: 'timer',
  aliases: [],
  description: 'Set up a timer for anything you want!',
  detailedDescription: `**Examples:**
  \`/timer value minutes:5\`
  \`/timer value hours:2 minutes:30\`
  \`/timer value minutes:10 message:Take a break!\``,
  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Building a timer...',
  executeCommand: timerExecuteCommand,
  messageIfFailure: 'Failed to set up a timer.',
  options: [],
  subcommandDetails: {
    create: {
      name: 'create',
      description: 'Set a timer with specified duration',
      executeCommand: timerSetExecuteCommand,
      isCommandResponseEphemeral: true,
      options: [
        {
          name: 'minutes',
          description: 'Number of minutes',
          required: false,
          type: CodeyCommandOptionType.INTEGER,
        },
        {
          name: 'hours',
          description: 'Number of hours',
          required: false,
          type: CodeyCommandOptionType.INTEGER,
        },
        {
          name: 'days',
          description: 'Number of days',
          required: false,
          type: CodeyCommandOptionType.INTEGER,
        },
        {
          name: 'message',
          description: 'Custom reminder message (optional)',
          required: false,
          type: CodeyCommandOptionType.STRING,
        },
      ],
      aliases: [],
      detailedDescription:
        'Set a timer by specifying seconds, minutes, hours, and/or days with an optional message',
      subcommandDetails: {},
    },
  },
};
