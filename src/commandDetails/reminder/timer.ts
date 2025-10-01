import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

const TIME_UNITS = {
  seconds: { multiplier: 1, singular: 'second', plural: 'seconds' },
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

const timerSetExecuteCommand: SapphireMessageExecuteType = (
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

  // Handle both Message and ChatInputCommandInteraction
  const user = 'author' in messageFromUser ? messageFromUser.author : messageFromUser.user;
  const channel = messageFromUser.channel;

  setTimeout(async () => {
    try {
      // Try to DM first
      await user.send(`⏰ **Timer Reminder:** ${reminderMessage}`);
    } catch (dmError) {
      // If DM fails, send a temporary message in channel
      if (channel && 'send' in channel) {
        try {
          const fallbackMsg = await channel.send(
            `<@${user.id}> ⏰ **Timer Reminder:** ${reminderMessage} (couldn't DM you!)`
          );
          // delete after 30 seconds to remove spam
          setTimeout(() => {
            fallbackMsg.delete().catch(() => {}); // Ignore if already deleted
          }, 30000);
        } catch (channelError) {
          console.error('Failed to send timer reminder:', channelError);
        }
      }
    }
  }, totalSeconds * 1000);

  const content = `Timer set for ${timeDescription}! I'll dm you with: "${reminderMessage}"`;
  return Promise.resolve(content);
};

export const timerCommandDetails: CodeyCommandDetails = {
  name: 'timer',
  aliases: [],
  description: 'Set up a timer for anything you want!',
  detailedDescription: `**Examples:**
  \`/timer value seconds:30\`
  \`/timer value minutes:5\`
  \`/timer value hours:2 minutes:30\`
  \`/timer value minutes:10 message:Take a break!\``,
  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Building a timer...',
  executeCommand: timerExecuteCommand,
  messageIfFailure: 'Failed to set up a timer.',
  options: [],
  subcommandDetails: {
    value: {
      name: 'value',
      description: 'Set a timer with specified duration',
      executeCommand: timerSetExecuteCommand,
      isCommandResponseEphemeral: true,
      options: [
        {
          name: 'seconds',
          description: 'Number of seconds',
          required: false,
          
          type: CodeyCommandOptionType.INTEGER,
        },
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
