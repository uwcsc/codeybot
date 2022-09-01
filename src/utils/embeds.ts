import { Client, Message, MessageEmbed, TextChannel, User } from 'discord.js';
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
  const kickEmbed = new MessageEmbed()
    .setColor(DEFAULT_EMBED_COLOUR)
    .addField('User', `${user.tag} (${user.id})`)
    .setFooter({ text: `Message ID: ${message.id} • ${new Date().toUTCString()}` });
  if (isSuccessful) kickEmbed.setTitle('Kick');
  else kickEmbed.setTitle('Kick Unsuccessful');
  if (reason) kickEmbed.addField('Reason', `${reason}`);
  kickEmbed.addField(
    'Channel',
    `<#${message.channel.id}> (${(message.channel as TextChannel).name})`,
  );
  if (message.content) kickEmbed.addField('Content', `${message.content}`);
  if (message.attachments) {
    message.attachments.forEach((attachment) => {
      kickEmbed.addField('Attachment', `${attachment.url}`);
    });
  }
  await (client.channels.cache.get(NOTIF_CHANNEL_ID) as TextChannel).send({ embeds: [kickEmbed] });
};
