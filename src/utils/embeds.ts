import {
  Client,
  CommandInteraction,
  Message,
  EmbedBuilder,
  MessagePayload,
  TextChannel,
  User,
} from 'discord.js';
import { SapphireMessageResponse } from '../codeyCommand';
import { vars } from '../config';

const NOTIF_CHANNEL_ID: string = vars.NOTIF_CHANNEL_ID;

export const DEFAULT_EMBED_COLOUR = '#0099ff';
export const INFO_EMBED_COLOUR = '#4287f5';

/*
 * Send kick embed
 */
export const sendKickEmbed = async (
  client: Client,
  message: Message,
  user: User,
  reason = '',
  isSuccessful = true,
): Promise<void> => {
  const kickEmbed = new EmbedBuilder()
    .setColor(DEFAULT_EMBED_COLOUR)
    .addFields([{ name: 'User', value: `${user.tag} (${user.id})` }])
    .setFooter({ text: `Message ID: ${message.id} • ${new Date().toUTCString()}` });
  if (isSuccessful) kickEmbed.setTitle('Kick');
  else kickEmbed.setTitle('Kick Unsuccessful');
  if (reason) kickEmbed.addFields([{ name: 'Reason', value: reason }]);
  kickEmbed.addFields([
    {
      name: 'Channel',
      value: `<#${message.channel.id}> (${(message.channel as TextChannel).name})`,
    },
  ]);

  if (message.content) kickEmbed.addFields([{ name: 'Content', value: message.content }]);
  if (message.attachments) {
    message.attachments.forEach((attachment) => {
      kickEmbed.addFields([{ name: 'Attachment', value: attachment.url }]);
    });
  }
  await (client.channels.cache.get(NOTIF_CHANNEL_ID) as TextChannel).send({ embeds: [kickEmbed] });
};

/**
 * Update a message embed
 */
export const updateMessageEmbed = (
  embedMessage: Message | CommandInteraction,
  newMessage: SapphireMessageResponse,
): void => {
  if (embedMessage instanceof Message) {
    embedMessage.edit(<MessagePayload>newMessage);
  } else if (embedMessage instanceof CommandInteraction) {
    embedMessage.editReply(<MessagePayload>newMessage);
  }
};
