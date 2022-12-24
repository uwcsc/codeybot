import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { logger } from '../logger/default';

let db: Database | null = null;

export const openCommandoDB = async (): Promise<Database> =>
  await open({ filename: 'db/commando.db', driver: sqlite3.Database });

const initCoffeeChatTables = async (db: Database): Promise<void> => {
  //Database to store past matches, with TIMESTAMP being the time matches were written into DB
  await db.run(
    `
    CREATE TABLE IF NOT EXISTS coffee_historic_matches (
      first_user_id TEXT NOT NULL,
      second_user_id TEXT NOT NULL,
      match_date TIMESTAMP NOT NULL
    )
    `,
  );
};

const initInterviewTables = async (db: Database): Promise<void> => {
  await db.run(
    `
    CREATE TABLE IF NOT EXISTS interviewers (
      user_id TEXT PRIMARY KEY,
      link TEXT NOT NULL,
      status INTEGER NOT NULL DEFAULT 0
    )
    `,
  );
  await db.run(
    `
    CREATE TABLE IF NOT EXISTS domains (
      user_id TEXT NOT NULL,
      domain TEXT NOT NULL
    )
    `,
  );
  await db.run('CREATE INDEX IF NOT EXISTS ix_domains_domain ON domains (domain)');
};

const initSuggestionsTable = async (db: Database): Promise<void> => {
  await db.run(
    `
    CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY NOT NULL,
      author_id VARCHAR(255) NOT NULL,
      author_username TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      suggestion TEXT NOT NULL,
      state VARCHAR(255) NOT NULL
    )
    `,
  );
};

const initUserCoinBonusTable = async (db: Database): Promise<void> => {
  await db.run(
    `
    CREATE TABLE IF NOT EXISTS user_coin_bonus (
      user_id VARCHAR(255) NOT NULL,
      bonus_type INTEGER NOT NULL,
      last_granted TIMESTAMP NOT NULL,
      PRIMARY KEY (user_id, bonus_type)
    )
    `,
  );
};

const initUserCoinLedgerTable = async (db: Database): Promise<void> => {
  await db.run(
    `
    CREATE TABLE IF NOT EXISTS user_coin_ledger (
      id INTEGER PRIMARY KEY NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      amount INTEGER NOT NULL,
      new_balance INTEGER NOT NULL,
      event INTEGER NOT NULL,
      reason VARCHAR(255),
      admin_id VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    `,
  );
  await db.run(
    'CREATE INDEX IF NOT EXISTS ix_user_coin_ledger_user_id ON user_coin_ledger (user_id)',
  );
};

const initUserCoinTable = async (db: Database): Promise<void> => {
  await db.run(
    `
    CREATE TABLE IF NOT EXISTS user_coin (
      user_id VARCHAR(255) PRIMARY KEY NOT NULL,
      balance INTEGER NOT NULL CHECK(balance>=0)
    )
    `,
  );
};

const initUserProfileTable = async (db: Database): Promise<void> => {
  await db.run(
    `
        CREATE TABLE IF NOT EXISTS user_profile_table (
            user_id VARCHAR(255) PRIMARY KEY NOT NULL,
            about_me TEXT,
            birth_date TEXT,
            preferred_name VARCHAR(32),
            preferred_pronouns VARCHAR(16),
            term VARCHAR(16),
            year INTEGER,
            last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_DATE,
            faculty VARCHAR(32),
            program VARCHAR(32),
            specialization VARCHAR(32),
            profile_emoji VARCHAR(32)
        )
        `,
  );
  await addSQLColumnIfNotExists(db, 'user_profile_table', 'profile_emoji', 'VARCHAR(32)');
};

const initRpsGameInfo = async (db: Database): Promise<void> => {
  // If player 2 ID is null, the game was against Codey
  await db.run(
    `
      CREATE TABLE IF NOT EXISTS rps_game_info (
        id INTEGER PRIMARY KEY NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        player1_id VARCHAR(30) NOT NULL,
        player2_id VARCHAR(30),
        bet INTEGER NOT NULL,
        player1_sign INTEGER NOT NULL DEFAULT 0,
        player2_sign INTEGER NOT NULL DEFAULT 0,
        status INTEGER NOT NULL DEFAULT 0
      )
    `,
  );
};

/*
  function: addSQLColumnIfNotExists
  parameters:
    * db: the object of SQLite Database
    * tableName: the name of the table where the column needs to be added
    * columnName: the name of the column that needs to be added to the table
    * columnDataType: the SQL data type of the column that needs to be added
  Example:
    addSQLColumnIfNotExists(db, 'user_profile_table', 'profile_emoji', 'VARCHAR(32)')
*/
const addSQLColumnIfNotExists = async (
  db: Database,
  tableName: string,
  columnName: string,
  columnDataType: string,
): Promise<void> => {
  const columns = await db.all(
    `SELECT *
      FROM pragma_table_info('${tableName}')
      WHERE name='${columnName}'
    `,
  );
  if (columns.length == 0) {
    await db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDataType}`);
  }
};

const initTables = async (db: Database): Promise<void> => {
  //initialize all relevant tables
  await initCoffeeChatTables(db);
  await initInterviewTables(db);
  await initSuggestionsTable(db);
  await initUserCoinBonusTable(db);
  await initUserCoinLedgerTable(db);
  await initUserCoinTable(db);
  await initUserProfileTable(db);
  await initRpsGameInfo(db);
};

export const openDB = async (): Promise<Database> => {
  if (db == null) {
    db = await open({
      filename: 'db/bot.db',
      driver: sqlite3.Database,
    });
    await initTables(db);
    logger.info({ message: 'Initialized database and tables.', where: 'openDB' });
  }
  return db;
};
