import { Command } from '@sapphire/framework';
import { CodeyCommandArguments, SapphireMessageResponse } from '../../codeyCommand';
import * as reminderComponents from '../../components/reminder/reminder';
import { CacheType, ChatInputCommandInteraction, Client, Message } from 'discord.js';
import {
  ActionRowBuilder,
  Colors,
  ComponentType,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';

const getUser = (messageFromUser: Message | ChatInputCommandInteraction) => {
  return 'user' in messageFromUser ? messageFromUser.user : messageFromUser.author;
};

export const genericViewResponse = async (
  _client: Client,
  messageFromUser: Message<boolean> | Command.ChatInputCommandInteraction<CacheType>,
  _args: CodeyCommandArguments,
  is_reminder = true,
): Promise<SapphireMessageResponse> => {
  const user = getUser(messageFromUser);

  const list = is_reminder
    ? await reminderComponents.getReminders(user.id)
    : await reminderComponents.getTimers(user.id);

  const itemType = is_reminder ? 'reminders' : 'timers';
  const itemTypeCapitalized = is_reminder ? 'Reminders' : 'Timers';
  const emoji = is_reminder ? '📝' : '⏰';

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

// Delete a reminder
export const genericDeleteResponse = async (
  _client: Client,
  messageFromUser: Message<boolean> | Command.ChatInputCommandInteraction<CacheType>,
  _args: CodeyCommandArguments,
  is_reminder = true,
): Promise<SapphireMessageResponse> => {
  const interaction = messageFromUser as ChatInputCommandInteraction;
  const user = getUser(messageFromUser);

  // Immediately defer the reply to prevent timeout
  await interaction.deferReply({ ephemeral: true });

  // Fetch active items for the user (reminders or timers)
  const items = is_reminder
    ? await reminderComponents.getReminders(user.id)
    : await reminderComponents.getTimers(user.id);

  const itemType = is_reminder ? 'reminder' : 'timer';
  const itemTypeCapitalized = is_reminder ? 'Reminder' : 'Timer';

  if (!items || items.length === 0) {
    const errorEmbed = new EmbedBuilder()
      .setTitle(`❌ No ${itemTypeCapitalized}s`)
      .setDescription(`You do not have any ${itemType}s to delete.`)
      .setColor(Colors.Red);
    await interaction.editReply({ embeds: [errorEmbed] });
    return '';
  }

  const embed = new EmbedBuilder()
    .setTitle(`🗑️ Delete a ${itemTypeCapitalized}`)
    .setDescription(`Select a ${itemType} to delete from the dropdown menu below.`)
    .setColor(Colors.Red);

  // Create dropdown menu options
  const options = items.map((item) => ({
    label: `ID: ${item.id} - "${
      item.message.length > 80 ? item.message.substring(0, 77) + '...' : item.message
    }"`,
    description: `Due: ${new Date(item.reminder_at).toLocaleString()}`,
    value: item.id.toString(),
  }));

  const customId = `delete-${itemType}-select`;
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(`Choose a ${itemType} to delete...`)
    .addOptions(options);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  // Send the message with the select menu
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

    const itemIdToDelete = parseInt(selection.values[0], 10);
    await reminderComponents.deleteReminder(itemIdToDelete, user.id, is_reminder);

    // Confirm deletion
    const successEmbed = new EmbedBuilder()
      .setTitle(`✅ ${itemTypeCapitalized} Deleted`)
      .setDescription(`Successfully deleted ${itemType} with ID \`${itemIdToDelete}\`.`)
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
