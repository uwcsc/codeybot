import { Database } from 'sqlite';
import _ from 'lodash';

import { openDB } from './db';

export enum BonusType {
  Daily = 1,
  Activity
}

export type Bonus = { bonusType: BonusType, bonusAmount: number, bonusCooldown: number };

export const coinBonusMap: { [key: string]: Bonus } = {
  daily : { bonusType: BonusType.Daily, bonusAmount: 50, bonusCooldown: 86400000 },
  activity : { bonusType: BonusType.Activity, bonusAmount: 2, bonusCooldown: 60000 }
};

export interface UserCoinBonus {
  id: string;
  user_id: string;
  bonus_type: number;
  last_granted: Date;
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
  res = await db.all(`SELECT last_granted FROM user_coin_bonus WHERE user_id = ? AND bonus_type = ?`, userId, bonusType);
  return res;
};

/*
  Time bonus
*/
export const timeBonusByUserId = async (userId: string, bonus: string): Promise<boolean> => {
  const lastBonusOccurence = await latestBonusByUserId(userId, coinBonusMap[bonus].bonusType);
  const lastBonusOccurenceTime = lastBonusOccurence[0]['last_granted'].getTime();
  const nowTime = new Date().getTime();
  const cooldown = nowTime - coinBonusMap[bonus].bonusCooldown;

  if (lastBonusOccurenceTime < cooldown) {
    await adjustCoinBalanceByUserId(userId, coinBonusMap[bonus].bonusAmount);
    return true;
  }
  return false;
};


/*
  Determine if any timely bonuses are available.
  Apply a bonus.
*/
export const applyBonusByUserId = async (userId: string): Promise<void> => {
  for (const [key] of Object.entries(coinBonusMap)) {
    let isBonusApplied = await timeBonusByUserId(userId, key);
    if (isBonusApplied) {
      break;
    }
  }
};

