import { ColorResolvable, MessageActionRow, MessageButton, MessageEmbed, User } from 'discord.js';
import { SapphireMessageResponse, SapphireSentMessageType } from '../../codeyCommand';
import { openDB } from '../db';
import { CodeyUserError } from '../../codeyUserError';
import { getEmojiByName } from '../emojis';
import { getRandomIntFrom1 } from '../../utils/num';

const CONNECT_FOUR_COLUMN_COUNT = 7;
const CONNECT_FOUR_ROW_COUNT = 6;

class ConnectFourGameTracker {
  // Key = id, Value = game
  games: Map<number, ConnectFourGame>;

  constructor() {
    this.games = new Map<number, ConnectFourGame>();
  }

  getGameFromId(id: number): ConnectFourGame | undefined {
    return this.games.get(id);
  }

  runFuncOnGame(gameId: number, func: (game: ConnectFourGame) => void): void {
    func(this.getGameFromId(gameId)!);
  }

  /*
    Starts a Connect Four game
  */
  async startGame(
    channelId: string,
    player1User: User,
    player2User?: User,
  ): Promise<ConnectFourGame> {
    const db = await openDB();
    const result = await db.run(
      `
    INSERT INTO connect_four_game_info (player1_id, player2_id)
    VALUES (?, ?)
  `,
      player1User.id,
      player2User?.id,
    );
    // get last inserted ID
    const id = result.lastID;
    if (id) {
      const columns: Array<ConnectFourColumn> = [];
      for (let i = 0; i < CONNECT_FOUR_COLUMN_COUNT; i++) {
        const column: ConnectFourColumn = { tokens: [], fill: 0 };
        columns.push(column);
        for (let j = 0; j < CONNECT_FOUR_ROW_COUNT; j++) {
          column.tokens[j] = ConnectFourGameSign.Pending;
        }
      }

      const state: ConnectFourGameState = {
        player1Id: player1User.id,
        player1Username: player1User.username,
        player2Id: player2User?.id,
        player2Username: player2User?.username ?? `Codey ${getEmojiByName('codey_love')}`,
        status: ConnectFourGameStatus.Pending,
        player1Sign: ConnectFourGameSign.Player1,
        player2Sign: ConnectFourGameSign.Player2,
        columns: columns,
      };
      const game = new ConnectFourGame(id!, channelId, state);
      this.games.set(id, game);
      return game;
    }
    throw new CodeyUserError(undefined, 'Something went wrong with starting the Connect4 game');
  }

  async endGame(gameId: number): Promise<void> {
    const db = await openDB();
    const game = this.getGameFromId(gameId);
    if (!game) {
      throw new CodeyUserError(undefined, `No game with game ID ${gameId} found`);
    }
    // Don't do anything if game status is still pending
    if (game.state.status === ConnectFourGameStatus.Pending) return;
    // Update winnings

    await db.run(
      `
      UPDATE connect_four_game_info
      SET player1_sign = ?, player2_sign = ?, status = ?
      WHERE id=?
      `,
      game.state.player1Sign,
      game.state.player2Sign,
      game.state.status,
      game.id,
    );
    connectFourGameTracker.games.delete(gameId);
  }
}

export const connectFourGameTracker = new ConnectFourGameTracker();

export enum ConnectFourTimeout {
  Player1,
  Player2,
}

export class ConnectFourGame {
  id: number;
  channelId: string;
  gameMessage!: SapphireSentMessageType;
  state: ConnectFourGameState;

  constructor(id: number, channelId: string, state: ConnectFourGameState) {
    this.id = id;
    this.channelId = channelId;
    this.state = state;
  }

  private determineWinner(sign: ConnectFourGameSign): ConnectFourGameStatus {
    if (sign === ConnectFourGameSign.Player1) {
      return ConnectFourGameStatus.Player1Win;
    } else if (sign === ConnectFourGameSign.Player2) {
      return ConnectFourGameStatus.Player2Win;
    } else {
      return ConnectFourGameStatus.Unknown;
    }
  }

  private determineStatus(state: ConnectFourGameState): ConnectFourGameStatus {
    console.log('--------------- Determining status ---------------');
    // Check for vertical win
    for (let i = 0; i < CONNECT_FOUR_COLUMN_COUNT; i++) {
      if (state.columns[i].fill >= 4) {
        // check if there are 4 of one player in a row
        // sliding window
        let token = ConnectFourGameSign.Pending;
        let m = 0;
        let n = 0;
        while (
          state.columns[i].tokens[n] != ConnectFourGameSign.Pending &&
          n < CONNECT_FOUR_ROW_COUNT
        ) {
          const current_token = state.columns[i].tokens[n];
          if (token == ConnectFourGameSign.Pending) {
            token = current_token;
          } else if (current_token != token && n - m + 1 == 4) {
            console.log('WINNER WINNER CHICKEN DINNER');
            return this.determineWinner(token);
          } else if (current_token != token) {
            m = n;
            token = current_token;
          }
          n++;
        }
        if (n - m + 1 == 4) {
          console.log('WINNER WINNER CHICKEN DINNER');
          return this.determineWinner(token);
        }
      }
    }

    return ConnectFourGameStatus.Pending;
  }

  public setStatus(timeout?: ConnectFourTimeout): void {
    console.log('--------------- Setting status ---------------');
    // Both players submitted a sign
    if (typeof timeout === 'undefined') {
      /*
        If one of the players' signs is still pending, something went wrong
      */
      if (
        this.state.player1Sign === ConnectFourGameSign.Pending ||
        this.state.player2Sign === ConnectFourGameSign.Pending
      ) {
        this.state.status = ConnectFourGameStatus.Unknown;
      } else {
        this.state.status = this.determineStatus(this.state);
      }
    } else if (timeout === ConnectFourTimeout.Player1) {
      this.state.status = ConnectFourGameStatus.Player1TimeOut;
    } else if (timeout === ConnectFourTimeout.Player2) {
      this.state.status = ConnectFourGameStatus.Player2TimeOut;
    } else {
      this.state.status = ConnectFourGameStatus.Unknown;
    }
  }

  public getEmbedColor(): ColorResolvable {
    switch (this.state.status) {
      case ConnectFourGameStatus.Player1Win:
        return 'GREEN';
      case ConnectFourGameStatus.Player2Win:
        return this.state.player2Id ? 'GREEN' : 'RED';
      case ConnectFourGameStatus.Draw:
        return 'ORANGE';
      default:
        return 'YELLOW';
    }
  }

  public getStatusAsString(): string {
    switch (this.state.status) {
      case ConnectFourGameStatus.Pending:
        return getStateAsString(this.state);
      case ConnectFourGameStatus.Player1Win:
        return `${this.state.player1Username} has won!`;
      case ConnectFourGameStatus.Player2Win:
        return `${this.state.player2Username} has won!`;
      case ConnectFourGameStatus.Draw:
        return `The match ended in a draw!`;
      // Timeout can be implemented later
      default:
        return `Something went wrong! ${getEmojiByName('codey_sad')}`;
    }
  }

  // Prints embed and adds buttons for the game
  public getGameResponse(): SapphireMessageResponse {
    const embed = new MessageEmbed()
      .setColor(this.getEmbedColor())
      .setTitle('Connect4')
      .setDescription(
        `
${this.state.player1Username} vs. ${this.state.player2Username}
`,
      )
      .addFields([
        {
          name: ' ',
          value: `
${this.getStatusAsString()}

${this.state.player1Username}: ${getEmojiFromSign(this.state.player1Sign)}
${this.state.player2Username}: ${getEmojiFromSign(this.state.player2Sign)}
`,
        },
      ]);
    // Buttons
    const row1 = new MessageActionRow().addComponents(
      new MessageButton().setCustomId(`connect4-1-${this.id}`).setLabel('1').setStyle('SECONDARY'),
      new MessageButton().setCustomId(`connect4-2-${this.id}`).setLabel('2').setStyle('SECONDARY'),
      new MessageButton().setCustomId(`connect4-3-${this.id}`).setLabel('3').setStyle('SECONDARY'),
      new MessageButton().setCustomId(`connect4-4-${this.id}`).setLabel('4').setStyle('SECONDARY'),
      new MessageButton().setCustomId(`connect4-5-${this.id}`).setLabel('5').setStyle('SECONDARY'),
    );

    const row2 = new MessageActionRow().addComponents(
      new MessageButton().setCustomId(`connect4-6-${this.id}`).setLabel('6').setStyle('SECONDARY'),
      new MessageButton().setCustomId(`connect4-7-${this.id}`).setLabel('7').setStyle('SECONDARY'),
    );

    return {
      embeds: [embed],
      components: this.state.status === ConnectFourGameStatus.Pending ? [row1, row2] : [],
    };
  }
}

export enum ConnectFourGameStatus {
  Waiting = 0,
  Pending = 1,
  Draw = 2,
  Player1Win = 3,
  Player2Win = 4,
  Player1TimeOut = 5,
  Player2TimeOut = 6,
  Unknown = 7,
}

export enum ConnectFourGameSign {
  Waiting = 0,
  Pending = 1,
  Player1 = 2,
  Player2 = 3,
}

export const getEmojiFromSign = (sign: ConnectFourGameSign): string => {
  switch (sign) {
    case ConnectFourGameSign.Waiting:
      return '⚔️';
    case ConnectFourGameSign.Pending:
      return ':white_circle:';
    case ConnectFourGameSign.Player1:
      return '🔴';
    case ConnectFourGameSign.Player2:
      return '🟡';
  }
};

export type ConnectFourGameState = {
  player1Id: string;
  player1Username: string;
  player2Id?: string;
  player2Username: string;
  status: ConnectFourGameStatus;
  player1Sign: ConnectFourGameSign;
  player2Sign: ConnectFourGameSign;
  columns: Array<ConnectFourColumn>;
};

export type ConnectFourColumn = {
  tokens: Array<ConnectFourGameSign>;
  fill: number;
};

export const getStateAsString = (state: ConnectFourGameState): string => {
  const columns = state.columns;
  let result = '';
  for (let i = CONNECT_FOUR_ROW_COUNT - 1; i >= 0; i--) {
    for (let j = 0; j < CONNECT_FOUR_COLUMN_COUNT; j++) {
      result += getEmojiFromSign(columns[j].tokens[i]);
    }
    result += '\n';
  }
  return result;
};

export const getCodeyConnectFourSign = (): ConnectFourGameSign => {
  return getRandomIntFrom1(7);
};

export const updateColumn = (column: ConnectFourColumn, sign: ConnectFourGameSign): void => {
  console.log('%%%%% UPDATE COLUMN %%%%%');
  console.log(column);
  const fill: number = column.fill;
  if (fill < CONNECT_FOUR_ROW_COUNT) {
    column.tokens[fill] = sign;
    column.fill++;
  }
};
