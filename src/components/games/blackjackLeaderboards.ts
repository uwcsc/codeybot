import _, { uniqueId } from 'lodash';
import { openDB } from '../db';


export const getNetTotalBlackjackBalanceByUserId = async (userId: string): Promise<number> => {
  const db = await openDB();
  const res = await db.get('SELECT net_gain_loss FROM blackjack_player_stats WHERE user_id = ?', userId);
  return _.get(res, 'net_gain_loss', 0);
};

export const getWinrateBlackjackByUserId = async (userId: string): Promise<number> => {
  const db = await openDB();
  const res = await db.get('SELECT winrate FROM blackjack_player_stats WHERE user_id = ?', userId);
  return _.get(res, 'winrate', 0);
}

export const getBlackjackWinrateLeaderboard = async (limit: number, offset = 0) => {
  const db = await openDB();
  const res = await db.all(
    `
      SELECT user_id, winrate
      FROM blackjack_player_stats
      ORDER BY winrate DESC
      LIMIT ? OFFSET ?
    `,
    limit,
    offset,
  );
  return res;
};

export const getBlackjackNetTotalLeaderboard = async (limit: number, offset = 0) => {
  const db = await openDB();
  const res = await db.all(
    `
      SELECT user_id, net_gain_loss
      FROM blackjack_player_stats
      ORDER BY net_gain_loss DESC
      LIMIT ? OFFSET ?
    `,
    limit,
    offset,
  );
  return res;
};