import { Message, PartialMessage } from 'discord.js';
import { vars } from '../config';
import { openDB } from '../components/db';

const RESUME_CHANNEL_ID: string = vars.RESUME_CHANNEL_ID;

export interface ResumePreview {
  initial_pdf_id: string;
  preview_id: string;
}

export const initMessageDelete = async (message: Message | PartialMessage): Promise<void> => {
  // If the message deleted isn't in the resume channel we don't delete anything
  if (message.channelId !== RESUME_CHANNEL_ID) {
    return;
  }
  const db = await openDB();
  let res: ResumePreview | undefined;
  res = await db.get('SELECT * FROM resume_preview_info WHERE initial_pdf_id = ?', message.id);
  if (res) {
    await db.run('DELETE FROM resume_preview_info WHERE initial_pdf_id = ?', message.id);
    const previewMessage = await message.channel.messages.fetch(res.preview_id);
    await previewMessage.delete();
  } else {
    // If the message deleted is the preview itself
    res = await db.get('SELECT * FROM resume_preview_info WHERE preview_id = ?', message.id);
    if (res) {
      await db.run('DELETE FROM resume_preview_info WHERE preview_id = ?', message.id);
      const pdfMessage = await message.channel.messages.fetch(res.initial_pdf_id);
      await pdfMessage.delete();
    }
  }
};
