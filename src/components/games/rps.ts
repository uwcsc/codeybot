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

  private determineWinner(
    player1Sign: RpsGameSign,
    player2Sign: RpsGameSign,
  ): 'player1' | 'player2' | 'tie' {
    if (player1Sign === player2Sign) {
      return 'tie';
    }
    if (
      (player1Sign === RpsGameSign.Paper && player2Sign === RpsGameSign.Rock) ||
      (player1Sign === RpsGameSign.Scissors && player2Sign === RpsGameSign.Paper) ||
      (player1Sign === RpsGameSign.Rock && player2Sign === RpsGameSign.Scissors)
    ) {
      return 'player1';
    }
    return 'player2';
  }

  private getStatus(timeout: 'player1' | 'player2' | null): RpsGameStatus {
    // Both players submitted a sign
    if (timeout === null) {
      /*
        If one of the players' signs is still pending, something went wrong
      */
      if (
        this.state.player1Sign === RpsGameSign.Pending ||
        this.state.player2Sign === RpsGameSign.Pending
      ) {
        return RpsGameStatus.Unknown;
      } else {
        const winner = this.determineWinner(this.state.player1Sign, this.state.player2Sign);
        switch (winner) {
          case 'player1':
            return RpsGameStatus.Player1Win;
          case 'player2':
            return RpsGameStatus.Player2Win;
          case 'tie':
            return RpsGameStatus.Draw;
          default:
            return RpsGameStatus.Unknown;
        }
      }
    } else if (timeout === 'player1') {
      return RpsGameStatus.Player1TimeOut;
    } else if (timeout === 'player2') {
      return RpsGameStatus.Player2TimeOut;
    } else {
      return RpsGameStatus.Unknown;
    }
  }

  runGame(player1Sign: RpsGameSign, player2Sign: RpsGameSign) {
    /*
      Time out can be implemented later on or in a later issue
    */
    const timeout = null;

    this.state.player1Sign = player1Sign;
    this.state.player2Sign = player2Sign;
    this.state.status = this.getStatus(timeout);
  }
}

export enum RpsGameStatus {
  Pending = 0,
  Player1Win = 1,
  Draw = 2,
  Player2Win = 3,
  Player1TimeOut = 4,
  Player2TimeOut = 5,
  Unknown = 6,
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
