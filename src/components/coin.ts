import { Database } from 'sqlite';
import _ from 'lodash';

import { openDB } from './db';

export enum BonusType {
  Daily = 0,
  Activity,
  InterviewerList
}

export enum UserCoinEvent {
  AdminCoinAdjust,
  AdminCoinUpdate,
  BonusDaily,
  BonusActivity,
  BonusInterviewerList,
  Blackjack
}

export type Bonus = {
  type: BonusType;
  event: UserCoinEvent;
  amount: number;
  cooldown: number | null;
  isMessageBonus: boolean; // true iff bonus is given when a user sends a message
};

/*
  Bonuses must be listed such that amount is in descending order, so "Only apply the largest bonus." holds in applyBonusByUserId.
  If isMessageBonus is true, then cooldown must not be null.
*/
export const coinBonusMap = new Map<BonusType, Bonus>([
  [
    BonusType.Daily,
    {
      type: BonusType.Daily,
      event: UserCoinEvent.BonusDaily,
      amount: 50,
      cooldown: 86400000, // one day in milliseconds
      isMessageBonus: true
    }
  ],
  [
    BonusType.Activity,
    {
      type: BonusType.Activity,
      event: UserCoinEvent.BonusActivity,
      amount: 1,
      cooldown: 60000, // one minute in milliseconds
      isMessageBonus: true
    }
  ],
  [
    BonusType.InterviewerList,
    {
      type: BonusType.InterviewerList,
      event: UserCoinEvent.BonusInterviewerList,
      amount: 10,
      cooldown: null,
      isMessageBonus: false
    }
  ]
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
      new_balance INTEGER NOT NULL,
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
  event: UserCoinEvent,
  reason: string | null = null,
  adminId: string | null = null
): Promise<void> => {
  const oldBalance = await getCoinBalanceByUserId(userId);
  const actualNewBalance = Math.max(newBalance, 0);
  await changeDbCoinBalanceByUserId(userId, oldBalance, actualNewBalance, event, reason, adminId);
};

/*
  If user doesn't exist, create a row with the specified amount as the balance.
  Otherwise, adjust the user's balance by the specified amount.
  The user's balance will be set to 0 if the adjustment brings it below 0.
*/
export const adjustCoinBalanceByUserId = async (
  userId: string,
  amount: number,
  event: UserCoinEvent,
  reason: string | null = null,
  adminId: string | null = null
): Promise<void> => {
  const oldBalance = await getCoinBalanceByUserId(userId);
  const newBalance = Math.max(oldBalance + amount, 0);
  await changeDbCoinBalanceByUserId(userId, oldBalance, newBalance, event, reason, adminId);
};

/*
  Changes data in the database, with oldBalance and newBalance being pre-computed and passed in as parameters.
  TODO: Wrap in transaction.
*/
export const changeDbCoinBalanceByUserId = async (
  userId: string,
  oldBalance: number,
  newBalance: number,
  event: UserCoinEvent,
  reason: string | null,
  adminId: string | null
): Promise<void> => {
  const db = await openDB();
  await db.run(
    `
    INSERT INTO user_coin (user_id, balance) VALUES (?, ?)
    ON CONFLICT(user_id)
    DO UPDATE SET balance = ?`,
    userId,
    newBalance,
    newBalance
  );
  await createCoinLedgerEntry(userId, oldBalance, newBalance, event, reason, adminId);
};

/*
  Adds an entry to the Codey coin ledger due to a change in a user's coin balance.
  reason is only applicable for admin commands and is optional.
  adminId is only applicable for admin commands and is mandatory.
*/
export const createCoinLedgerEntry = async (
  userId: string,
  oldBalance: number,
  newBalance: number,
  event: UserCoinEvent,
  reason: string | null,
  adminId: string | null
): Promise<void> => {
  const db = await openDB();
  await db.run(
    'INSERT INTO user_coin_ledger (user_id, amount, new_balance, event, reason, admin_id) VALUES (?, ?, ?, ?, ?, ?)',
    userId,
    newBalance - oldBalance,
    newBalance,
    event,
    reason,
    adminId
  );
};

/*
  If (user, bonusType) doesn't exist, create row with current time as this bonusType log.
  Otherwise, update last_granted to CURRENT_TIMESTAMP.
*/
export const updateUserBonusTableByUserId = async (userId: string, bonusType: BonusType): Promise<void> => {
  const db = await openDB();
  await db.run(
    `
    INSERT INTO user_coin_bonus (user_id, bonus_type, last_granted) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, bonus_type)
    DO UPDATE SET last_granted = CURRENT_TIMESTAMP`,
    userId,
    bonusType
  );
};

/*
  Get the time of the latest bonus applied to a user based on type
*/
export const latestBonusByUserId = async (userId: string, type: BonusType): Promise<UserCoinBonus | undefined> => {
  const db = await openDB();
  const res: UserCoinBonus | undefined = await db.get(
    `SELECT last_granted FROM user_coin_bonus WHERE user_id = ? AND bonus_type = ?`,
    userId,
    type
  );
  return res;
};

/*
  Adjusts balance by bonus amount if appropriate cooldown has passed.
  Returns true if the a bonusType is applied to a user, and false otherwise.
*/
export const applyTimeBonus = async (userId: string, bonusType: BonusType): Promise<boolean> => {
  const bonusOfInterest = coinBonusMap.get(bonusType);

  if (!bonusOfInterest) {
    return false; // type does not exist
  }

  const lastBonusOccurence = await latestBonusByUserId(userId, bonusOfInterest.type);
  const nowTime = new Date().getTime();
  if (bonusOfInterest.cooldown === null) {
    throw 'Bonus does not have cooldown';
  }
  const cooldown = nowTime - bonusOfInterest.cooldown;
  // lastBonusOccurenceTime either does not exist yet (set as -1), or is pulled from db
  const lastBonusOccurenceTime = !lastBonusOccurence ? -1 : new Date(lastBonusOccurence['last_granted']).getTime();

  // TODO wrap operations in transaction
  if (!lastBonusOccurence || lastBonusOccurenceTime < cooldown) {
    await adjustCoinBalanceByUserId(userId, bonusOfInterest.amount, bonusOfInterest.event);
    await updateUserBonusTableByUserId(userId, bonusType);
    return true; // bonus type is applied
  }

  return false; // bonus type is not applied
};

/*
  Determine if any timely bonuses are available.
  Only apply the largest bonus.
*/
export const applyBonusByUserId = async (userId: string): Promise<boolean> => {
  for (const bonus of coinBonusMap.values()) {
    if (bonus.isMessageBonus) {
      const isBonusApplied = await applyTimeBonus(userId, bonus.type);
      if (isBonusApplied) {
        return false; // return statement bc cannot break forEach loop
      }
    }
  }
  return false;
};
