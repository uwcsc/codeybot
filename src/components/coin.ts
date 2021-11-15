import { Database } from 'sqlite';
import _ from 'lodash';

import { openDB } from './db';

export enum UserCoinEvent {
  AdminCoinAdjust,
  AdminCoinUpdate,
  BonusDaily,
  BonusActivity,
  Blackjack
}

export const initUserCoinTable = async (db: Database): Promise<void> => {
  await db.run(
    `
    CREATE TABLE IF NOT EXISTS user_coin (
      user_id VARCHAR(255) PRIMARY KEY NOT NULL,
      balance INTEGER NOT NULL CHECK(balance>=0)
    );
    `
  );
};

export const initUserCoinBonusTable = async (db: Database): Promise<void> => {
  await db.run(
    `
    CREATE TABLE IF NOT EXISTS user_coin_bonus (
      user_id VARCHAR(255) NOT NULL,
      bonus_type INTEGER NOT NULL,
      last_granted TIMESTAMP NOT NULL,
      PRIMARY KEY (user_id, bonus_type)
    );
    `
  );
};

export const initUserCoinLedgerTable = async (db: Database): Promise<void> => {
  await db.run(
    `
    CREATE TABLE IF NOT EXISTS user_coin_ledger (
      id INTEGER PRIMARY KEY NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      amount INTEGER NOT NULL,
      event INTEGER NOT NULL,
      reason VARCHAR(255),
      admin_id VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    `
  );
  await db.run('CREATE INDEX IF NOT EXISTS ix_user_coin_ledger_user_id ON user_coin_ledger (user_id)');
};

export const getCoinBalanceByUserId = async (userId: string): Promise<number> => {
  const db = await openDB();
  // Query user coin balance from DB.
  const res = await db.get('SELECT balance FROM user_coin WHERE user_id = ?', userId);
  // If user doesn't have a balance, default to 0.
  return _.get(res, 'balance', 0);
};

/*
  If user doesn't exist, create row with newBalance as the balance.
  Otherwise, update balance to newBalance.
  The user's balance will be set to 0 if newBalance is negative.
*/
export const updateCoinBalanceByUserId = async (
  userId: string,
  newBalance: number,
  event: number,
  reason: string | null = null,
  adminId: string | null = null
): Promise<void> => {
  const db = await openDB();
  const oldBalance = await getCoinBalanceByUserId(userId);
  const updateAmount = Math.max(newBalance, 0);
  await db.run(
    `
    INSERT INTO user_coin (user_id, balance) VALUES (?, ?)
    ON CONFLICT(user_id)
    DO UPDATE SET balance = ?`,
    userId,
    updateAmount,
    updateAmount
  );
  await createCoinLedgerEntry(userId, updateAmount - oldBalance, event, reason, adminId);
};

/*
  If user doesn't exist, create a row with the specified amount as the balance.
  Otherwise, adjust the user's balance by the specified amount.
  The user's balance will be set to 0 if the adjustment brings it below 0.
*/
export const adjustCoinBalanceByUserId = async (
  userId: string,
  amount: number,
  event: number,
  reason: string | null = null,
  adminId: string | null = null
): Promise<void> => {
  const db = await openDB();
  const oldBalance = await getCoinBalanceByUserId(userId);
  await db.run(
    `
    INSERT INTO user_coin (user_id, balance) VALUES (?, MAX(?, 0))
    ON CONFLICT(user_id)
    DO UPDATE SET balance = MAX(balance + ?, 0)`,
    userId,
    amount,
    amount
  );
  const newBalance = await getCoinBalanceByUserId(userId);
  await createCoinLedgerEntry(userId, newBalance - oldBalance, event, reason, adminId);
};

/*
  Adds an entry to the Codey coin ledger due to a change in a user's coin balance.
  reason is only applicable for admin commands and is optional.
  adminId is only applicable for admin commands and is mandatory.
*/
export const createCoinLedgerEntry = async (
  userId: string,
  amount: number,
  event: number,
  reason: string | null,
  adminId: string | null
): Promise<void> => {
  const db = await openDB();
  await db.run(
    'INSERT INTO user_coin_ledger (user_id, amount, event, reason, admin_id) VALUES (?, ?, ?, ?, ?)',
    userId,
    amount,
    event,
    reason,
    adminId
  );
};
