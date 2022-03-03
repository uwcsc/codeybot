import { Message, MessageEmbed, User, TextChannel } from 'discord.js';
import { client } from '../bot';
import { vars } from '../config';

const NOTIF_CHANNEL_ID: string = vars.NOTIF_CHANNEL_ID;

export const EMBED_COLOUR = '#0099ff';

/*
 * Send kick embed
 */
export const sendKickEmbed = async (message: Message, user: User, reason = '', isSuccessful = true): Promise<void> => {
  const kickEmbed = new MessageEmbed()
    .setColor(EMBED_COLOUR)
    .addField('User', `${user.tag} (${user.id})`)
    .setFooter(`Message ID: ${message.id} • ${new Date().toUTCString()}`);
  if (isSuccessful) kickEmbed.setTitle('Kick');
  else kickEmbed.setTitle('Kick Unsuccessful');
  if (reason) kickEmbed.addField('Reason', `${reason}`);
  kickEmbed.addField('Channel', `<#${message.channel.id}> (${(message.channel as TextChannel).name})`);
  if (message.content) kickEmbed.addField('Content', `${message.content}`);
  if (message.attachments) {
    message.attachments.forEach((attachment) => {
      kickEmbed.addField('Attachment', `${attachment.url}`);
    });
  }
  await (client.channels.cache.get(NOTIF_CHANNEL_ID) as TextChannel).send({ embeds: [kickEmbed] });
};
