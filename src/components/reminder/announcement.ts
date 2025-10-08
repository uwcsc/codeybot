import { openDB } from '../db';

export interface Announcement {
  id: number;
  user_id: string;
  title: string;
  created_at: string;
  reminder_at: string;
  message: string;
  image_url?: string;
  status: number;
}

// Returns a list of announcements that are due now
export const getDueAnnouncements = async (): Promise<Announcement[]> => {
  const db = await openDB();
  const now = new Date().toISOString();
  return await db.all('SELECT * FROM announcements WHERE reminder_at <= ? AND status = 0', now);
};

// Returns a list of all announcements
export const getAnnouncements = async (): Promise<Announcement[] | undefined> => {
  const db = await openDB();
  return await db.all('SELECT * FROM announcements WHERE status = 0');
};

// Mark announcement as sent
export const markAnnouncementAsSent = async (announcementId: number): Promise<void> => {
  const db = await openDB();
  await db.run('UPDATE announcements SET status = 1 WHERE id = ?', announcementId);
};

// Delete an announcement
export const deleteAnnouncement = async (announcementId: number): Promise<void> => {
  const db = await openDB();
  await db.run('DELETE FROM announcements WHERE id = ?', announcementId);
};

// Adds an announcement to the DB (with optional image URL)
export const addAnnouncement = async (
  user_id: string,
  title: string,
  created_at: string,
  reminder_at: string,
  message: string,
  image_url?: string,
): Promise<void> => {
  const db = await openDB();
  if (image_url) {
    // With image URL
    await db.run(
      `
      INSERT INTO announcements (user_id, title, created_at, reminder_at, message, image_url, status)
      VALUES(?,?,?,?,?,?,?);
      `,
      user_id,
      title,
      created_at,
      reminder_at,
      message,
      image_url,
      0,
    );
  } else {
    // Without image URL
    await db.run(
      `
      INSERT INTO announcements (user_id, title, created_at, reminder_at, message, status)
      VALUES(?,?,?,?,?,?);
      `,
      user_id,
      title,
      created_at,
      reminder_at,
      message,
      0,
    );
  }
};
