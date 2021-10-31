import { Database } from 'sqlite';
import _ from 'lodash';

import { openDB } from './db';

export enum BonusType {
  Daily = 0,
  Activity
}

export type Bonus = { type: BonusType; amount: number; cooldown: number };

export const coinBonusMap = new Map<BonusType, Bonus>([
  [BonusType.Daily, { type: BonusType.Daily, amount: 50, cooldown: 86400000 }], // one day in milliseconds
  [BonusType.Activity, { type: BonusType.Daily, amount: 50, cooldown: 86400000 }] // one minute in milliseconds
]);

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
  If (user, bonusType) doesn't exist, create row with current time as this bonusType log.
  Otherwise, update last_granted to NOW().
*/
export const updateUserBonusTableByUserId = async (userId: string, bonusType: BonusType): Promise<void> => {
  const db = await openDB();
  const bonusTypeInTable = bonusType as number;
  await db.run(
    `
    INSERT INTO user_coin_bonus (user_id, bonus_type, last_granted) VALUES (?, ?, NOW())
    ON CONFLICT(user_id, bonus_type)
    DO UPDATE SET last_granted = NOW()`,
    userId,
    bonusTypeInTable
  );
};

/*
  Get the time of the latest bonus applied to a user based on type
*/
export const latestBonusByUserId = async (userId: string, type: BonusType): Promise<UserCoinBonus[] | undefined> => {
  const db = await openDB();
  const res: UserCoinBonus[] | undefined = await db.get(
    `SELECT last_granted FROM user_coin_bonus WHERE user_id = ? AND bonus_type = ?`,
    userId,
    type
  );
  return res;
};

/*
  Time bonus
*/
export const timeBonusByUserId = async (userId: string, bonusType: BonusType): Promise<boolean> => {
  const bonusOfInterest = coinBonusMap.get(bonusType);

  if (bonusOfInterest == undefined) {
    return false;
  }

  const lastBonusOccurence = await latestBonusByUserId(userId, bonusOfInterest.type);

  if (lastBonusOccurence == undefined) {
    await adjustCoinBalanceByUserId(userId, bonusOfInterest.amount);
    await updateUserBonusTableByUserId(userId, bonusType);
    return true;
  }

  const lastBonusOccurenceTime = lastBonusOccurence[0]['last_granted'].getTime();
  const nowTime = new Date().getTime();
  const cooldown = nowTime - bonusOfInterest.cooldown;

  if (lastBonusOccurenceTime < cooldown) {
    await adjustCoinBalanceByUserId(userId, bonusOfInterest.amount);
    await updateUserBonusTableByUserId(userId, bonusType);
    return true;
  }
  return false;
};

/*
  Determine if any timely bonuses are available.
  Only apply the largest bonus.
*/
export const applyBonusByUserId = async (userId: string): Promise<boolean> => {
  const bonuses = Object.keys(coinBonusMap);
  console.log(bonuses);
  bonuses.every(async function (bonus) {
    const isBonusApplied = await timeBonusByUserId(userId, BonusType.Activity); // change 2nd back to 'bonus' later
    if (isBonusApplied) {
      return false; // break statement bc cannot break forEach loop
    }
  });
  return false;
};
