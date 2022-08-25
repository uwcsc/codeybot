import { openDB } from '../db';
import { logger } from '../../logger/default';

export class RpsGame {
  id: number;
  channelId: string;
  state: RpsGameState;

  constructor(id: number, channelId: string, state: RpsGameState) {
    this.id = id;
    this.channelId = channelId;
    this.state = state;
  }
}

export enum RpsGameStatus {
  Pending = 0,
  Player1Win = 1,
  Draw = 2,
  Player2Win = 3,
  Player1TimeOut = 4,
  Player2TimeOut = 5,
}

export enum RpsGameSign {
  Pending = 0,
  Rock = 1,
  Paper = 2,
  Scissors = 3,
}

export type RpsGameState = {
  player1Id: string;
  player2Id?: string;
  bet: number;
  status: RpsGameStatus;
  player1Sign: RpsGameSign;
  player2Sign: RpsGameSign;
};

/*
  Starts a RPS game
*/
export const startGame = async (
  bet: number,
  channelId: string,
  player1Id: string,
  player2Id?: string,
): Promise<RpsGame> => {
  const db = await openDB();
  const result = await db.run(
    `
    INSERT INTO rps_game_info (player1_id, player2_id, bet)
    VALUES (?, ?, ?)
  `,
    [player1Id, player2Id, bet],
  );
  // get last inserted ID
  const id = result.lastID;
  if (id) {
    const state: RpsGameState = {
      player1Id,
      player2Id,
      bet,
      status: 0,
      player1Sign: 0,
      player2Sign: 0,
    };
    const game = new RpsGame(id!, channelId, state);
    return game;
  }
  throw new Error('Something went wrong when starting the RPS game');
};
