import {
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  User,
  ButtonStyle,
} from 'discord.js';
import { SapphireMessageResponse, SapphireSentMessageType } from '../../codeyCommand';
import { openDB } from '../db';
import { CodeyUserError } from '../../codeyUserError';
import { getEmojiByName } from '../emojis';
import { getRandomIntFrom1 } from '../../utils/num';
import { isNull } from 'lodash';

const CONNECT_FOUR_COLUMN_COUNT = 7;
const CONNECT_FOUR_ROW_COUNT = 6;

const TWO_IN_A_ROW_WEIGHT = 1;
const THREE_IN_A_ROW_WEIGHT = 3;


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
        winType: ConnectFourWinType.None,
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

  private checkForVerticalWin(
    column: ConnectFourColumn,
    verticalIndex: number,
    sign: ConnectFourGameSign,
  ): boolean {
    if (verticalIndex >= 3) {
      for (let i = verticalIndex - 1; i > verticalIndex - 4; i--) {
        if (column.tokens[i] != sign) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  private checkForHorizontalWin(
    state: ConnectFourGameState,
    horizontalIndex: number,
    verticalIndex: number,
    sign: ConnectFourGameSign,
  ): boolean {
    let left_pointer = horizontalIndex;
    let right_pointer = horizontalIndex;

    while (left_pointer - 1 >= 0 && state.columns[left_pointer - 1].tokens[verticalIndex] == sign) {
      left_pointer--;
    }
    while (
      right_pointer + 1 < CONNECT_FOUR_COLUMN_COUNT &&
      state.columns[right_pointer + 1].tokens[verticalIndex] == sign
    ) {
      right_pointer++;
    }
    if (right_pointer - left_pointer + 1 >= 4) {
      return true;
    } else {
      return false;
    }
  }

  private checkForDiagonalLBRTWin(
    state: ConnectFourGameState,
    horizontalIndex: number,
    verticalIndex: number,
    sign: ConnectFourGameSign,
  ): boolean {
    let left_pointer_x = horizontalIndex;
    let left_pointer_y = verticalIndex;
    let right_pointer_x = horizontalIndex;
    let right_pointer_y = verticalIndex;

    while (
      left_pointer_x - 1 >= 0 &&
      left_pointer_y - 1 >= 0 &&
      state.columns[left_pointer_x - 1].tokens[left_pointer_y - 1] == sign
    ) {
      left_pointer_x--;
      left_pointer_y--;
    }
    while (
      right_pointer_x + 1 < CONNECT_FOUR_COLUMN_COUNT &&
      right_pointer_y + 1 < CONNECT_FOUR_ROW_COUNT &&
      state.columns[right_pointer_x + 1].tokens[right_pointer_y + 1] == sign
    ) {
      right_pointer_x++;
      right_pointer_y++;
    }

    if (right_pointer_x - left_pointer_x + 1 >= 4) {
      return true;
    }

    return false;
  }

  private checkForDiagonalLTRBWin(
    state: ConnectFourGameState,
    horizontalIndex: number,
    verticalIndex: number,
    sign: ConnectFourGameSign,
  ): boolean {
    let left_pointer_x = horizontalIndex;
    let left_pointer_y = verticalIndex;
    let right_pointer_x = horizontalIndex;
    let right_pointer_y = verticalIndex;

    while (
      left_pointer_x - 1 >= 0 &&
      left_pointer_y + 1 < CONNECT_FOUR_ROW_COUNT &&
      state.columns[left_pointer_x - 1].tokens[left_pointer_y + 1] == sign
    ) {
      left_pointer_x--;
      left_pointer_y++;
    }
    while (
      right_pointer_x + 1 < CONNECT_FOUR_COLUMN_COUNT - 1 &&
      right_pointer_y - 1 >= 0 &&
      state.columns[right_pointer_x + 1].tokens[right_pointer_y - 1] == sign
    ) {
      right_pointer_x++;
      right_pointer_y--;
    }

    if (right_pointer_x - left_pointer_x + 1 >= 4) {
      return true;
    }

    return false;
  }

  public async setStatus(
    state: ConnectFourGameState,
    columnIndex: number,
  ): Promise<ConnectFourGameStatus> {

    // Instead of exhaustively checking every combination of tokens we can simply use the fact that
    //  as of this point the user hasn't won yet, so we just need to check if the token that was just placed
    //  is part of a winning combination
    // newly placed token
    const horizontalIndex = columnIndex;
    const verticalIndex = state.columns[columnIndex].fill - 1;
    const column = state.columns[columnIndex];
    const sign: ConnectFourGameSign = state.columns[columnIndex].tokens[verticalIndex];

    if (this.checkForVerticalWin(column, verticalIndex, sign)) {
      // Check for vertical win
      state.winType = ConnectFourWinType.Vertical;
      state.status = this.determineWinner(sign);
    } else if (this.checkForHorizontalWin(state, horizontalIndex, verticalIndex, sign)) {
      // Check for horizontal win
      state.winType = ConnectFourWinType.Horizontal;
      state.status = this.determineWinner(sign);
    } else if (this.checkForDiagonalLBRTWin(state, horizontalIndex, verticalIndex, sign)) {
      // Check for diagonal win (left top right bottom)
      state.winType = ConnectFourWinType.DiagonalLBRT;
      state.status = this.determineWinner(sign);
    } else if (this.checkForDiagonalLTRBWin(state, horizontalIndex, verticalIndex, sign)) {
      // Check for diagonal win (left bottom right top)
      state.winType = ConnectFourWinType.DiagonalLTRB;
      state.status = this.determineWinner(sign);
    } else if (state.columns.every((column) => column.fill === 6)) {
      // Check for draw
      state.status = ConnectFourGameStatus.Draw;
    } else {
      state.status = ConnectFourGameStatus.Pending;
    }

    return state.status;
  }

  public getEmbedColor(): keyof typeof Colors {
    switch (this.state.status) {
      case ConnectFourGameStatus.Player1Win:
        return 'Red';
      case ConnectFourGameStatus.Player2Win:
        return 'Yellow';
      case ConnectFourGameStatus.Draw:
        return 'Orange';
      default:
        return 'Blue';
    }
  }

  private parseWin(state: ConnectFourGameState): string {
    switch (state.winType) {
      case ConnectFourWinType.Vertical:
        return 'vertical';
      case ConnectFourWinType.Horizontal:
        return 'horizontal';
      case ConnectFourWinType.DiagonalLBRT:
        return 'diagonal (bottom left to top right)';
      case ConnectFourWinType.DiagonalLTRB:
        return 'diagonal (top left to bottom right)';
      default:
        return 'unknown';
    }
  }

  public getStatusAsString(): string {
    switch (this.state.status) {
      case ConnectFourGameStatus.Pending:
        return getStateAsString(this.state);
      case ConnectFourGameStatus.Player1Win:
        return (
          '**' +
          getStateAsString(this.state) +
          `\n${this.state.player1Username} has won with a ${this.parseWin(this.state)} connect 4!**`
        );
      case ConnectFourGameStatus.Player2Win:
        return (
          '**' +
          getStateAsString(this.state) +
          `\n${this.state.player2Username} has won with a ${this.parseWin(this.state)} connect 4**`
        );
      case ConnectFourGameStatus.Draw:
        return `The match ended in a draw!`;
      // Timeout can be implemented later
      default:
        return `Something went wrong! ${getEmojiByName('codey_sad')}`;
    }
  }

  // Prints embed and adds buttons for the game
  public getGameResponse(): SapphireMessageResponse {
    const embed = new EmbedBuilder()
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
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`connect4-1-${this.id}`)
        .setLabel('1')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`connect4-2-${this.id}`)
        .setLabel('2')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`connect4-3-${this.id}`)
        .setLabel('3')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`connect4-4-${this.id}`)
        .setLabel('4')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`connect4-5-${this.id}`)
        .setLabel('5')
        .setStyle(ButtonStyle.Secondary),
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`connect4-6-${this.id}`)
        .setLabel('6')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`connect4-7-${this.id}`)
        .setLabel('7')
        .setStyle(ButtonStyle.Secondary),
    );

    return {
      embeds: [embed],
      components: this.state.status === ConnectFourGameStatus.Pending ? [row1, row2] : [],
    };
  }

  // ConnectFourGameState
  // Waiting = 0,
  // Pending = 1,
  // Draw = 2,
  // Player1Win = 3,
  // Player2Win = 4,
  // Player1TimeOut = 5,
  // Player2TimeOut = 6,
  // Unknown = 7,
  private updateState = (state : ConnectFourGameState, columnNumber : number, turn : number): ConnectFourGameState => {
    const fill : number = state.columns[columnNumber].fill;
    if (turn === 1){ //means its Codeybot's turn
      state.columns[columnNumber].tokens[fill] = 3;
    } else{
      state.columns[columnNumber].tokens[fill] = 2;
    }
    state.columns[columnNumber].fill = state.columns[columnNumber].fill + 1;
    return state;
  }

  // returns number of possible wins remaining
  private possibleWins = (state : ConnectFourGameState, opponentSign : number): number => {
    let possibleWins : number = 0;
    // check vertical
    for (let i  = 0; i < CONNECT_FOUR_COLUMN_COUNT; i++){
      for (let j = 3; j < CONNECT_FOUR_ROW_COUNT; j++){
        if (state.columns[i].tokens[j] !== opponentSign && state.columns[i].tokens[j-1] !== opponentSign && state.columns[i].tokens[j-2] !== opponentSign && state.columns[i].tokens[j-3] !== opponentSign){
          possibleWins = possibleWins + 1;
        }
      }
    }
    // check horizonal
    for (let j = 0; j < CONNECT_FOUR_ROW_COUNT; j++){
      for (let i = 3; i < CONNECT_FOUR_COLUMN_COUNT; i++){
        if (state.columns[i].tokens[j] !== opponentSign && state.columns[i-1].tokens[j] !== opponentSign && state.columns[i-2].tokens[j] !== opponentSign && state.columns[i-3].tokens[j] !== opponentSign){
          possibleWins = possibleWins + 1;
        }
      }
    }
    // check diagonal up
    for (let i = 0; i <= 3; i++){
      for (let j = 0; j <= 2; j++){
        if (state.columns[i].tokens[j] !== opponentSign && state.columns[i+1].tokens[j+1] !== opponentSign && state.columns[i+2].tokens[j+2] !== opponentSign && state.columns[i+3].tokens[j+3] !== opponentSign){
          possibleWins = possibleWins + 1;
        }
      }
    }

    //check diagonal down
    for (let i = 3; i < CONNECT_FOUR_COLUMN_COUNT; i++){
      for (let j = 0; j <= 2; j++){
        if (state.columns[i].tokens[j] !== opponentSign && state.columns[i-1].tokens[j+1] !== opponentSign && state.columns[i-2].tokens[j+2] !== opponentSign && state.columns[i-3].tokens[j+3] !== opponentSign){
          possibleWins = possibleWins + 1;
        }
      }
    }
    return possibleWins;
  }

  // takes a ConnectFourGameState and evaluates it according to heuristic function
  private evaluate = (state : ConnectFourGameState): number => {
    let codeyPoints : number = this.possibleWins(state, 2); // 3 represents Codeybot sign
    let opponentPoints : number = this.possibleWins(state, 3); // 2 represents player1 sign
    return codeyPoints - opponentPoints;
  }

// from perspective of Codeybot, +infinity means Codeybot win, -infinity means Player1 wins
// turn = 1, means it's Codeybot's turn, turn = -1 means it's opponent's turn
// returns the best possible score that can be achieved, given that Player1 plays optimally
  private miniMax = (state : ConnectFourGameState, depth : number, turn : number): number =>{
    if (state.status === 2){ // means draw
      return 0;
    }
    if (state.status === 3){ // means Player1 wins
      return -Infinity;
    }
    if (state.status === 4){ // means Player 2 wins
      return Infinity;
    }
    if (depth === 0){
      return this.evaluate(state); //heuristic function to evaluate state of game
    }

    // if it is Codeybot's turn, we want to find move that maximizes score
    if (turn === 1){
      let value : number = -Infinity;
      const column_choices : number[] = [0, 1, 2, 3, 4, 5, 6];
      for (const column_choice of column_choices){
        if (state.columns[column_choice].fill < CONNECT_FOUR_ROW_COUNT){
          let newState : ConnectFourGameState = JSON.parse(JSON.stringify(state));
          this.updateState(newState, column_choice, turn);
          this.setStatus(newState, column_choice);
          value = Math.max(value, this.miniMax(newState, depth - 1, turn * -1));
        }
      }
      return value;
    } else { // (turn = -1) it is Player 1's turn, so we want to find minimum score (this assumes Player 1 plays optimally)
      let value : number = Infinity;
      const column_choices : number[] = [0, 1, 2, 3, 4, 5, 6];
      for (const column_choice of column_choices){
        // if selected column is not already full, recurse down the branch
        if (state.columns[column_choice].fill < CONNECT_FOUR_ROW_COUNT){
          let newState : ConnectFourGameState = JSON.parse(JSON.stringify(state));
          this.updateState(newState, column_choice, turn);
          this.setStatus(newState, column_choice);
          value = Math.min(value, this.miniMax(newState, depth - 1, turn * -1));
        }
      }
      return value;
    }
  }

  private findBestColumn = (state : ConnectFourGameState): number =>{
    let column_scores : number[] = [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity];
    for (let i = 0; i < 7; i++){
      if (state.columns[i].fill < CONNECT_FOUR_ROW_COUNT){
        let newState : ConnectFourGameState = JSON.parse(JSON.stringify(state)); // make a deep copy of game state
        this.updateState(newState, i, 1);
        this.setStatus(newState, i);
        column_scores[i] = this.miniMax(newState, 4, -1);
      } 
    }
    let value = -Infinity;
    let best_column = -1;
    for (let i = 0; i < 7; i++){
      if (column_scores[i] > value){
        value = column_scores[i];
        best_column = i;
      } 
    }
    // if best_column = -1, then that means all posible moves lead to certain loss
    if (best_column === -1){
      for (let i = 0; i < 7; i++){
        if (state.columns[i].fill < CONNECT_FOUR_ROW_COUNT){
          return i;
        }
      }
    } 
    return best_column;
  } 

// takes in ConnectFourGameState, returns best column for Codeybot to play in
  public getBestMove = (state : ConnectFourGameState): number => {
    return this.findBestColumn(state);
  };
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

export enum ConnectFourWinType {
  Horizontal = 0,
  Vertical = 1,
  DiagonalLTRB = 2,
  DiagonalLBRT = 3,
  Draw = 4,
  None = 5,
}

export type ConnectFourGameState = {
  player1Id: string;
  player1Username: string;
  player2Id?: string;
  player2Username: string;
  status: ConnectFourGameStatus;
  player1Sign: ConnectFourGameSign;
  player2Sign: ConnectFourGameSign;
  columns: Array<ConnectFourColumn>;
  winType: ConnectFourWinType;
};

export type ConnectFourColumn = {
  tokens: Array<ConnectFourGameSign>;
  fill: number;
};

export const getStateAsString = (state: ConnectFourGameState): string => {
  const columns = state.columns;
  let result = '';
  result += '1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣\n';
  for (let i = CONNECT_FOUR_ROW_COUNT - 1; i >= 0; i--) {
    for (let j = 0; j < CONNECT_FOUR_COLUMN_COUNT; j++) {
      result += getEmojiFromSign(columns[j].tokens[i]);
    }
    result += '\n';
  }
  return result;
};

// export const getCodeyConnectFourSign = (): ConnectFourGameSign => {
//   return getRandomIntFrom1(7);
// };

export const updateColumn = (column: ConnectFourColumn, sign: ConnectFourGameSign): boolean => {
  const fill: number = column.fill;
  if (fill < CONNECT_FOUR_ROW_COUNT) {
    column.tokens[fill] = sign;
    column.fill++;
    return true;
  } else {
    return false;
  }
};
