import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  ComponentType,
  EmbedBuilder,
  Message,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import * as announcementComponents from '../../components/reminder/announcement';

const getUser = (messageFromUser: Message | ChatInputCommandInteraction) => {
  return 'user' in messageFromUser ? messageFromUser.user : messageFromUser.author;
};

// Create a new announcement
const announcementCreateCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const user = getUser(messageFromUser);
  const interaction = messageFromUser as ChatInputCommandInteraction;

  const dateOption = args['date'] as string;
  const timeOption = interaction.options.getString('time') || '';
  const messageOption = interaction.options.getString('message') || '';
  const photoOption = interaction.options.getString('photo') || ''; // Add this line

  const modal = new ModalBuilder()
    .setCustomId('announcement-modal')
    .setTitle('📅 Set Your Announcement');

  const titleInput = new TextInputBuilder()
    .setCustomId('announcement-title')
    .setLabel('Title')
    .setPlaceholder('e.g., Codey eats π')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100)
    .setMinLength(3);

  const dateInput = new TextInputBuilder()
    .setCustomId('announcement-date')
    .setLabel('Date (YYYY-MM-DD)')
    .setPlaceholder('e.g., 2025-12-25')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(10)
    .setMinLength(8);

  if (dateOption) {
    dateInput.setValue(dateOption);
  }

  const timeInput = new TextInputBuilder()
    .setCustomId('announcement-time')
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
    .setCustomId('announcement-message')
    .setLabel('Announcement Message')
    .setPlaceholder('What would you like to announce?')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMinLength(1);

  // Pre-populate message field if provided
  if (messageOption) {
    messageInput.setValue(messageOption);
  }

  const photoInput = new TextInputBuilder()
    .setCustomId('announcement-photo') // Changed ID for consistency
    .setLabel('Photo Embed')
    .setPlaceholder('Provide an Embedded Photo Link if you have one.')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(500);

  if (photoOption) {
    photoInput.setValue(photoOption);
  }

  const titleActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
  const dateActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput);
  const timeActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput);
  const messageActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
  const photoActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(photoInput);

  modal.addComponents(
    titleActionRow,
    dateActionRow,
    timeActionRow,
    messageActionRow,
    photoActionRow,
  );
  await interaction.showModal(modal);

  try {
    const modalSubmit = await interaction.awaitModalSubmit({
      time: 300000, // 5 minutes timeout
      filter: (i) => i.customId === 'announcement-modal' && i.user.id === interaction.user.id,
    });
    console.log('submitted modal!');

    // Match these field IDs with the customIds set on the input fields
    const title = modalSubmit.fields.getTextInputValue('announcement-title').trim();
    const date = modalSubmit.fields.getTextInputValue('announcement-date').trim();
    const time = modalSubmit.fields.getTextInputValue('announcement-time').trim();
    const message = modalSubmit.fields.getTextInputValue('announcement-message').trim();
    const image_url = modalSubmit.fields.getTextInputValue('announcement-photo').trim();

    const dateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/;
    const timeRegex = /^\d{1,2}:\d{2}$/;

    let validationErrors = [];

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
    console.log(inputDateTime);
    const now = new Date();

    if (inputDateTime <= now) {
      validationErrors.push('Announcement time must be in the future');
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

    await announcementComponents.addAnnouncement(
      user.id,
      title,
      now.toISOString(),
      inputDateTime.toISOString(),
      message,
      image_url.length > 0 ? image_url : undefined, // Only pass image_url if it's not empty
    );
    const formattedTimestamp = `<t:${Math.floor(inputDateTime.getTime() / 1000)}:F>`;

    const previewMessage = [
      `*Scheduled for: ${formattedTimestamp}*`,
      "**Here's how the announcement will appear:**",
      '',
      message,
    ].join('\n');

    await modalSubmit.reply({
      content: `✅ **Announcement created and scheduled!**\n\n${previewMessage}`,
      ephemeral: true,
      files: image_url.length > 0 ? [image_url] : [], // Attach the image if provided
      allowedMentions: { parse: ['users', 'roles'] },
    });
  } catch (error) {
    console.log('Modal submission timed out or was cancelled');
  }
  return '';
};

const announcementExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  return `User id is ${messageFromUser.client.id}`;
};

const announcementViewCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const interaction = messageFromUser as ChatInputCommandInteraction;
  const user = getUser(messageFromUser);

  // Immediately defer the reply to prevent timeout
  await interaction.deferReply({ ephemeral: true });

  // Fetch all announcements for the user
  const announcements = await announcementComponents.getAnnouncements();

  if (!announcements || announcements.length === 0) {
    const noAnnouncementsEmbed = new EmbedBuilder()
      .setTitle('No Announcements')
      .setDescription("You don't have any scheduled announcements.")
      .setColor(Colors.Red);

    await interaction.editReply({ embeds: [noAnnouncementsEmbed] });
    return '';
  }

  // Create dropdown options for each announcement
  const options = announcements.map((announcement) => ({
    label:
      announcement.title.length > 25
        ? announcement.title.substring(0, 22) + '...'
        : announcement.title,
    description: `Scheduled for ${new Date(announcement.reminder_at).toLocaleString()}`,
    value: announcement.id.toString(),
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('announcement-select')
    .setPlaceholder('Select an announcement to preview')
    .addOptions(options);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const listEmbed = new EmbedBuilder()
    .setTitle('📢 Scheduled Announcements')
    .setDescription('Select an announcement from the dropdown to preview how it will look')
    .setColor(Colors.Blue)
    .addFields({
      name: 'Total Announcements',
      value: announcements.length.toString(),
      inline: true,
    })
    .setTimestamp();

  const response = await interaction.editReply({
    embeds: [listEmbed],
    components: [row],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    filter: (i) => i.user.id === user.id && i.customId === 'announcement-select',
    time: 60000, // 1 minute timeout
  });

  collector.on('collect', async (selectInteraction) => {
    const announcementId = parseInt(selectInteraction.values[0], 10);

    const selectedAnnouncement = announcements.find((a) => a.id === announcementId);

    if (!selectedAnnouncement) {
      await selectInteraction.update({
        content: 'Error: Could not find the selected announcement',
        embeds: [],
        components: [],
      });
      return;
    }

    const formattedTimestamp = `<t:${Math.floor(
      new Date(selectedAnnouncement.reminder_at).getTime() / 1000,
    )}:F>`;

    // Create the preview content similar to how it will be displayed
    const previewMessage = [
      selectedAnnouncement.message,
      '',
      `*(Scheduled to be announced on ${formattedTimestamp})*`,
    ].join('\n');

    const backButton = new ButtonBuilder()
      .setCustomId('back-to-list')
      .setLabel('Back to List')
      .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton);

    // Show the announcement preview
    await selectInteraction.update({
      content: previewMessage,
      embeds: [],
      components: [buttonRow],
      files: selectedAnnouncement.image_url ? [selectedAnnouncement.image_url] : [],
    });

    const buttonCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === user.id && i.customId === 'back-to-list',
      time: 60000, // 1 minute timeout
    });

    buttonCollector.on('collect', async (buttonInteraction) => {
      await buttonInteraction.update({
        content: null,
        embeds: [listEmbed],
        components: [row],
        files: [],
      });
    });
  });

  collector.on('end', async (collected) => {
    if (collected.size === 0) {
      // Timeout - remove components
      await interaction.editReply({
        content: 'Selection timed out.',
        components: [],
      });
    }
  });

  return '';
};

const announcementDeleteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const interaction = messageFromUser as ChatInputCommandInteraction;
  const user = getUser(messageFromUser);
  console.log(`clicked delete announcements!`);

  // Defering to avoid timeout
  await interaction.deferReply({ ephemeral: true });

  const announcements = await announcementComponents.getAnnouncements();

  console.log(`announcements:`, announcements);

  if (!announcements || announcements.length === 0) {
    const errorEmbed = new EmbedBuilder()
      .setTitle(`❌ No Announcements`)
      .setDescription(`You do not have any announcements to delete.`)
      .setColor(Colors.Red);
    await interaction.editReply({ embeds: [errorEmbed] });
    return '';
  }

  const embed = new EmbedBuilder()
    .setTitle(`🗑️ Delete an Announcement`)
    .setDescription(`Select an announcement to delete from the dropdown menu below.`)
    .setColor(Colors.Red);

  const options = announcements.map((announcement) => ({
    label: `${
      announcement.title.length > 50
        ? announcement.title.substring(0, 47) + '...'
        : announcement.title
    }`,
    description: `Scheduled for: ${new Date(announcement.reminder_at).toLocaleString()}`,
    value: announcement.id.toString(),
  }));

  const customId = `delete-announcement-select`;
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(`Choose an announcement to delete...`)
    .addOptions(options);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const response = await interaction.editReply({
    embeds: [embed],
    components: [row],
  });

  try {
    const selection = await response.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === user.id && i.customId === customId,
      time: 60000, // 60 seconds timeout
    });

    const announcementIdToDelete = parseInt(selection.values[0], 10);
    await announcementComponents.deleteAnnouncement(announcementIdToDelete);

    // Confirm deletion
    const successEmbed = new EmbedBuilder()
      .setTitle(`✅ Announcement Deleted`)
      .setDescription(`Successfully deleted announcement.`)
      .setColor(Colors.Green);

    await selection.update({ embeds: [successEmbed], components: [] });
  } catch (e) {
    const timeoutEmbed = new EmbedBuilder()
      .setTitle('⏰ Timed Out')
      .setDescription('You did not make a selection in time.')
      .setColor(Colors.Yellow);
    await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
  }
  return '';
};

export const announcementCommandDetails: CodeyCommandDetails = {
  name: 'announcement',
  aliases: [],
  description: 'Set up an announcement!',
  detailedDescription: `**Examples:**
  \`/announcement\` - Opens an  setup form`,
  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Setting up the announcement...',
  executeCommand: announcementExecuteCommand,
  messageIfFailure: 'Failed to set up the announcement',
  options: [],
  subcommandDetails: {
    create: {
      name: 'create',
      description: 'Set up an announcement with specified duration',
      executeCommand: announcementCreateCommand,
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
          description: 'What you want to announce.',
          type: CodeyCommandOptionType.STRING,
          required: false,
        },
        {
          name: 'photo',
          description: 'URL of an image to include with the announcement',
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
      description: 'Delete one of the planned announcements.',
      executeCommand: announcementDeleteCommand,
      isCommandResponseEphemeral: true,
      options: [],
      aliases: [],
      detailedDescription: 'Choose an announccement to permanently delete it.',
      subcommandDetails: {},
    },

    view: {
      name: 'view',
      description: 'View any announcements that are planned!',
      executeCommand: announcementViewCommand,
      isCommandResponseEphemeral: true,
      options: [],
      aliases: [],
      detailedDescription: '',
      subcommandDetails: {},
    },
  },
};
