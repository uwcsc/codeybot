import { Database } from 'sqlite';
import _ from 'lodash';

import { openDB } from './db';

export const dailyBonusAmount = 50;
export const minuteBonusAmount = 2;

export enum BonusType {
  Daily = 'daily',
  Minute = 'minute'
}

export interface UserCoinBonus {
  id: string;
  user_id: string;
  bonus_type: string;
  last_granted: string;
}

export const initUserCoinTable = async (db: Database): Promise<void> => {
  await db.run(
    `
    CREATE TABLE IF NOT EXISTS user_coin (
      user_id VARCHAR(255) PRIMARY KEY NOT NULL,
      balance INTEGER NOT NULL CHECK(balance>=0),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      last_granted TIMESTAMP,
      PRIMARY KEY (user_id, bonus_type)
    );
    `
  );
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
export const updateCoinBalanceByUserId = async (userId: string, newBalance: number): Promise<void> => {
  const db = await openDB();
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
};

/*
  If user doesn't exist, create a row with the specified amount as the balance.
  Otherwise, adjust the user's balance by the specified amount.
  The user's balance will be set to 0 if the adjustment brings it below 0.
*/
export const adjustCoinBalanceByUserId = async (userId: string, amount: number): Promise<void> => {
  const db = await openDB();
  await db.run(
    `
    INSERT INTO user_coin (user_id, balance) VALUES (?, MAX(?, 0))
    ON CONFLICT(user_id)
    DO UPDATE SET balance = MAX(balance + ?, 0)`,
    userId,
    amount,
    amount
  );
};

/*
  Get the time of the latest bonus applied to a user based on type
*/
export const latestBonusByUserId = async (userId: string, bonusType: BonusType): Promise<UserCoinBonus[]> => {
  const db = await openDB();
  let res: UserCoinBonus[];
  res = await db.all(`SELECT max(last_granted) FROM user_coin_bonus WHERE user_id = ? AND bonus_type = ?`, userId, bonusType);
  return res;
};


/*
  Determine if a daily bonus is applicable, or a minute bonus.
  Apply bonus.
*/
export const applyBonusByUserId = async (userId: string): Promise<void> => {
  const lastDailyBonus = await latestBonusByUserId(userId,BonusType.Daily);
  const lastMinuteBonus = await latestBonusByUserId(userId,BonusType.Minute);
  const lastDailyBonusTime = new Date(lastDailyBonus[0]['last_granted']).getTime();
  const lastMinuteBonusTime = new Date(lastMinuteBonus[0]['last_granted']).getTime();
  const nowTime = new Date().getTime();
  const dayAgo = nowTime - 86400000; // take one day off
  const minAgo = nowTime - 60000; // take one minute off

  // add smol buffer for the milliseconds this takes to compute?

  if (lastDailyBonusTime < dayAgo) {
    await adjustCoinBalanceByUserId(userId, dailyBonusAmount);
  } else if (lastMinuteBonusTime < minAgo) {
    await adjustCoinBalanceByUserId(userId, minuteBonusAmount);
  }
};

