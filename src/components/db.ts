import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

import { initSuggestionsTable } from './suggestions';
import { initInterviewTables } from './interview';
import { initCoffeeChatTables } from './coffeechat';
import { initUserCoinBonusTable, initUserCoinTable } from './coin';
import logger from './logger';

let db: Database | null = null;

export const openCommandoDB = async (): Promise<Database> =>
  await open({ filename: 'db/commando.db', driver: sqlite3.Database });

const initTables = async (db: Database): Promise<void> => {
  //initialize all relevant tables
  await initSuggestionsTable(db);
  await initInterviewTables(db);
  await initCoffeeChatTables(db);
  await initUserCoinTable(db);
  await initUserCoinBonusTable(db);
};

export const openDB = async (): Promise<Database> => {
  if (db == null) {
    db = await open({
      filename: 'db/bot.db',
      driver: sqlite3.Database
    });
    await initTables(db);
    logger.info('Initialized database and tables.');
  }
  return db;
};
