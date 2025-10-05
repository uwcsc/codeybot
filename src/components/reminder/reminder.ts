import _ from 'lodash';
import { openDB } from '../db';
export interface Reminder {
  id: any;
  user_id: string;
  created_at: string;
  reminder_at: string;
  message: string;
}

// Returns a list of reminders that are due now

export const getDueReminders = async (): Promise<Reminder[]> => {
  const db = await openDB();
  const now = new Date().toISOString();
  return await db.all(
    'SELECT * FROM reminders WHERE reminder_at <= ? AND status = 0', 
    now
  );
};

// Returns a list of reminders that have yet to be shown
export const getReminders = async (userId: string): Promise<Reminder[] | undefined> => {
  const db = await openDB();
  console.log(`Received request for user_id ${userId}`);
  return await db.all('SELECT * FROM reminders WHERE user_id = ? AND status = 0 AND is_reminder = 1', userId);
};


// Returns a list of timers that have yet to be shown
export const getTimers = async (userId: string): Promise<Reminder[] | undefined> => {
  const db = await openDB();
  console.log(`Received request for user_id ${userId}`);
  return await db.all('SELECT * FROM reminders WHERE user_id = ? AND status = 0 AND is_reminder = 0', userId);
};

// Mark reminder as sent
export const markReminderAsSent = async (reminderId: number): Promise<void> => {
  const db = await openDB();
  await db.run('UPDATE reminders SET status = 1 WHERE id = ?', reminderId);
};

export const deleteReminder = async (reminderId: number, userId: string, is_reminder: boolean): Promise<void> => {
  const db = await openDB();
  await db.run('DELETE FROM reminders WHERE id = ? AND user_id = ? and is_reminder = ?', reminderId, userId, is_reminder);
};

// Adds a reminder to the DB
export const addReminder = async (
  user_id: string,
  is_reminder: boolean,
  created_at: string,
  reminder_at: string,
  message: string,
): Promise<void> => {
  const db = await openDB();

  console.log('addReminder parameters:');
  console.log('userId:', user_id);
  console.log('created_at:', created_at);
  console.log('reminder_at:', reminder_at);
  console.log('message:', message);

  await db.run(
    `
    INSERT INTO reminders (user_id, is_reminder, created_at, reminder_at, message, status)
    VALUES(?,?,?,?,?,?);
    `,
    user_id,
    is_reminder,
    created_at,
    reminder_at,
    message,
    0,
  );
};
