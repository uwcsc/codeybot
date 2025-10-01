import _ from 'lodash';
import { openDB } from './db';


export enum Status {
  Active,
  Paused,
}

export interface Reminder {
  userId: string,
  created_at: string,
  reminder_at: string,
  message: string
}

/*
  Returns a list of reminders by userID.
*/
export const getReminders = async (
  userId: string
): Promise<Reminder[] | undefined>  => {
  const db = await openDB();
  console.log(`Received request for user_id ${userId}`)
  return await db.all('SELECT * FROM reminders WHERE user_id = ?', userId);
};


// Adds a reminder to the DB
export const addReminder = async (
userId: string, created_at: string, reminder_at: string, message: string): Promise<void> => {
  const db = await openDB();
  
  console.log('addReminder parameters:');
  console.log('userId:', userId);
  console.log('created_at:', created_at);
  console.log('reminder_at:', reminder_at);
  console.log('message:', message);

  // Save reminder into DB
  await db.run(
    `
    INSERT INTO reminders (user_id, created_at, reminder_at, message, status)
    VALUES(?,?,?,?,?);
    `,
    userId,
    created_at,
    reminder_at,
    message,
    0
  );
};
