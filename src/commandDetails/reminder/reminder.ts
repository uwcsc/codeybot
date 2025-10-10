import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  Message,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import * as reminderComponents from '../../components/reminder/reminder';
import { genericDeleteResponse, genericViewResponse } from './sharedViews';

const getUser = (messageFromUser: Message | ChatInputCommandInteraction) => {
  return 'user' in messageFromUser ? messageFromUser.user : messageFromUser.author;
};

// Create a new reminder
const reminderCreateCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const user = getUser(messageFromUser);

  const interaction = messageFromUser as ChatInputCommandInteraction;

  // Get option values from the command (if provided)
  const dateOption = args['date'] as string;
  const timeOption = interaction.options.getString('time') || '';
  const messageOption = interaction.options.getString('message') || '';

  // Create the modal
  const modal = new ModalBuilder().setCustomId('reminder-modal').setTitle('📅 Set Your Reminder');

  // Create text inputs for date, time, and message with pre-populated values
  const dateInput = new TextInputBuilder()
    .setCustomId('reminder-date')
    .setLabel('Date (YYYY-MM-DD)')
    .setPlaceholder('e.g., 2025-12-25')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(10)
    .setMinLength(8);

  // Pre-populate date field if provided
  if (dateOption) {
    dateInput.setValue(dateOption);
  }

  const timeInput = new TextInputBuilder()
    .setCustomId('reminder-time')
    .setLabel('Time (HH:MM) - 24 hour format')
    .setPlaceholder('e.g., 14:30 or 09:15')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(5)
    .setMinLength(4);

  // Pre-populate time field if provided
  if (timeOption) {
    timeInput.setValue(timeOption);
  }

  const messageInput = new TextInputBuilder()
    .setCustomId('reminder-message')
    .setLabel('Reminder Message')
    .setPlaceholder('What would you like to be reminded about?')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(500)
    .setMinLength(1);

  // Pre-populate message field if provided
  if (messageOption) {
    messageInput.setValue(messageOption);
  }

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput);
  const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput);
  const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);

  modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

  await interaction.showModal(modal);

  try {
    const modalSubmit = await interaction.awaitModalSubmit({
      time: 300000,
      filter: (i) => i.customId === 'reminder-modal' && i.user.id === interaction.user.id,
    });

    const date = modalSubmit.fields.getTextInputValue('reminder-date').trim();
    const time = modalSubmit.fields.getTextInputValue('reminder-time').trim();
    const message = modalSubmit.fields.getTextInputValue('reminder-message').trim();

    // Basic validation
    const dateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/;
    const timeRegex = /^\d{1,2}:\d{2}$/;

    const validationErrors = [];

    if (!dateRegex.test(date)) {
      validationErrors.push('Date must be in YYYY-MM-DD format');
    }

    if (!timeRegex.test(time)) {
      validationErrors.push('Time must be in HH:MM format (24-hour)');
    }

    const dateParts = date.split('-');
    const paddedDate = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(
      2,
      '0',
    )}`;

    const timeParts = time.split(':');
    const paddedTime = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;

    const inputDateTime = new Date(`${paddedDate}T${paddedTime}:00`);
    const now = new Date();

    if (inputDateTime <= now) {
      validationErrors.push('Reminder time must be in the future');
    }

    if (validationErrors.length > 0) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Invalid Input')
        .setDescription(
          `Please fix the following errors:\n${validationErrors
            .map((error) => `• ${error}`)
            .join('\n')}`,
        )
        .setColor(Colors.Red);
      await modalSubmit.reply({ embeds: [errorEmbed], ephemeral: true });
      return '';
    }
    reminderComponents.addReminder(
      user.id,
      true,
      now.toISOString(),
      inputDateTime.toISOString(),
      message,
    );
    // Create success output embed
    const outputEmbed = new EmbedBuilder()
      .setTitle('📝 Reminder Created Successfully!')
      .setDescription("Here's your reminder details:")
      .addFields(
        { name: '📅 Date', value: `\`${date}\``, inline: true },
        { name: '🕐 Time', value: `\`${time}\``, inline: true },
        {
          name: '📍 Scheduled For',
          value: `<t:${Math.floor(inputDateTime.getTime() / 1000)}:F>`,
          inline: false,
        },
        { name: '💬 Message', value: `\`${message}\``, inline: false },
      )
      .setColor(Colors.Green)
      .setFooter({ text: 'Your reminder has been set!' })
      .setTimestamp();

    await modalSubmit.reply({ embeds: [outputEmbed], ephemeral: true });
  } catch (error) {
    // Modal submission timed out or was cancelled
  }

  return '';
};

// View reminders
const reminderViewCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const ret = await genericViewResponse(_client, messageFromUser, args);
  return ret as SapphireMessageResponse;
};

// Delete Reminders
const reminderDeleteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const ret = await genericDeleteResponse(_client, messageFromUser, args);
  return ret as SapphireMessageResponse;
};

export const reminderCommandDetails: CodeyCommandDetails = {
  name: 'reminder',
  aliases: [],
  description: 'Set up a reminder for anything you want!',
  detailedDescription: `**Examples:**
  \`/reminder\` - Opens an interactive reminder setup form`,
  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Setting up reminder form...',
  messageIfFailure: 'Failed to set up reminder form.',
  options: [],
  subcommandDetails: {
    create: {
      name: 'create',
      description: 'Set a timer with specified duration',
      executeCommand: reminderCreateCommand,
      isCommandResponseEphemeral: true,
      options: [
        {
          name: 'date',
          description: 'A date in the format YYYY-MM-DD',
          type: CodeyCommandOptionType.STRING,
          required: false,
        },
        {
          name: 'time',
          description: 'A time in the format HH:DD',
          type: CodeyCommandOptionType.STRING,
          required: false,
        },
        {
          name: 'message',
          description: 'Message for your Reminder',
          type: CodeyCommandOptionType.STRING,
          required: false,
        },
      ],
      aliases: [],
      detailedDescription: '',
      subcommandDetails: {},
    },

    delete: {
      name: 'delete',
      description: 'Delete one of your active reminders.',
      executeCommand: reminderDeleteCommand,
      isCommandResponseEphemeral: true,
      options: [],
      aliases: [],
      detailedDescription: 'Choose a reminder to permanently delete it.',
      subcommandDetails: {},
    },

    view: {
      name: 'view',
      description: 'View any reminders you set!',
      executeCommand: reminderViewCommand,
      isCommandResponseEphemeral: true,
      options: [],
      aliases: [],
      detailedDescription: '',
      subcommandDetails: {},
    },
  },
};
