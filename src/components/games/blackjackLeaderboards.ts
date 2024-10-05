import _ from 'lodash';
import { openDB } from '../db';

export const getNetTotalBlackjackBalanceByUserId = async (userId: string): Promise<number> => {
  const db = await openDB();
  const res = await db.get(
    'SELECT net_gain_loss FROM blackjack_player_stats WHERE user_id = ?',
    userId,
  );
  return _.get(res, 'net_gain_loss', 0);
};

export const getWinrateBlackjackByUserId = async (userId: string): Promise<number> => {
  const db = await openDB();
  const res = await db.get('SELECT winrate FROM blackjack_player_stats WHERE user_id = ?', userId);
  return _.get(res, 'winrate', 0);
};

interface WinRate {
  user_id: string;
  winrate: number;
}

export const getBlackjackWinrateLeaderboard = async (
  limit: number,
  offset = 0,
): Promise<WinRate[]> => {
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

interface NetGainLoss {
  user_id: string;
  net_gain_loss: number;
}

export const getBlackjackNetTotalLeaderboard = async (
  limit: number,
  offset = 0,
): Promise<NetGainLoss[]> => {
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

export const adjustBlackjackGameResult = async (
  userId: string,
  balanceChange: number,
): Promise<void> => {
  const db = await openDB();
  const playerStats = await db.get(
    'SELECT * FROM blackjack_player_stats WHERE user_id = ?',
    userId,
  );

  let gamesPlayed = 1;
  let gamesWon = balanceChange > 0 ? 1 : 0;
  let gamesLost = balanceChange < 0 ? 1 : 0;
  let netGainLoss = balanceChange;

  if (playerStats) {
    gamesPlayed += playerStats.games_played;
    gamesWon += playerStats.games_won;
    gamesLost += playerStats.games_lost;
    netGainLoss += playerStats.net_gain_loss;

    const winrate = gamesWon / gamesPlayed;

    await db.run(
      'UPDATE blackjack_player_stats SET games_played = ?, games_won = ?, games_lost = ?, net_gain_loss = ?, winrate = ? WHERE user_id = ?',
      gamesPlayed,
      gamesWon,
      gamesLost,
      netGainLoss,
      winrate,
      userId,
    );
  } else {
    const winrate = gamesWon / gamesPlayed;
    await db.run(
      'INSERT INTO blackjack_player_stats (user_id, games_played, games_won, games_lost, net_gain_loss, winrate) VALUES (?, ?, ?, ?, ?, ?)',
      userId,
      gamesPlayed,
      gamesWon,
      gamesLost,
      netGainLoss,
      winrate,
    );
  }
};
