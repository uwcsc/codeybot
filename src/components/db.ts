import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

import { initSuggestionsTable } from './suggestions';
import { initInterviewTables } from './interview';
import { initCoffeechatTables } from './coffeechat';

let db: Database | null = null;

export const openCommandoDB = async (): Promise<Database> =>
  await open({ filename: 'db/commando.db', driver: sqlite3.Database });

const initTables = async (db: Database): Promise<void> => {
  //initialize all relevant tables
  await initSuggestionsTable(db);
  await initInterviewTables(db);
  await initCoffeechatTables(db);
};

export const openDB = async (): Promise<Database> => {
  if (db == null) {
    db = await open({
      filename: 'db/bot.db',
      driver: sqlite3.Database
    });
    await initTables(db);
    console.log('Initialized database and tables.');
  }
  return db;
};
