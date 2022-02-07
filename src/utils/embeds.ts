import { Message, MessageEmbed, User, TextChannel } from 'discord.js';
import { client } from '../bot';
import { vars } from '../config';

const NOTIF_CHANNEL_ID: string = vars.NOTIF_CHANNEL_ID;

export const EMBED_COLOUR = '#0099ff';
export const RESUME_EMBED_COLOUR = '#77bb00';

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
  await (client.channels.cache.get(NOTIF_CHANNEL_ID) as TextChannel).send(kickEmbed);
};

/*
* Send embed for getting an example resume
*/
export const getResumeEmbed = (field: string, term: string, resumes: any): MessageEmbed => {
  try {
    // get link to resume (just first one in the "list" for now)
    // const resumeLink = require('./resumes.json')[field][term][0].url;
    const resumeLink = resumes["web-dev"]["2"][0].url;
    // logger.info(JSON.stringify(resumeFile));

    return new MessageEmbed()
      .setColor(RESUME_EMBED_COLOUR)
      .setTitle('Example Resume')
      .setDescription(`Example resume for ${field} for work term ${term}`)
      .addFields({
        name: 'Resume Link',
        value: resumeLink
      });
  } catch (e) {
    return new MessageEmbed()
      .setColor(RESUME_EMBED_COLOUR)
      .setTitle('Example Resume')
      .setDescription(`Example resume for ${field} for work term ${term}`)
      .addFields({
        name: 'Sorry!',
        value: 'No resumes exist for this combination of category and term.'
      });
  }
};
