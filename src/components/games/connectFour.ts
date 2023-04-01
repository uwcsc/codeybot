import { ColorResolvable, MessageActionRow, MessageButton, MessageEmbed, User } from 'discord.js';
import { SapphireMessageResponse, SapphireSentMessageType } from '../../codeyCommand';
import { adjustCoinBalanceByUserId, UserCoinEvent } from '../coin';
import { openDB } from '../db';
import { CodeyUserError } from '../../codeyUserError';
import { getEmojiByName } from '../emojis';
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
    bet: number,
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
      bet,
    );
    // get last inserted ID
    const id = result.lastID;
    if (id) {
      const state: ConnectFourGameState = {
        player1Id: player1User.id,
        player1Username: player1User.username,
        player2Id: player2User?.id,
        player2Username: player2User?.username ?? `Codey ${getEmojiByName('codey_love')}`,
        status: ConnectFourGameStatus.Pending,
        player1Sign: ConnectFourGameSign.Pending,
        player2Sign: ConnectFourGameSign.Pending,
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

export enum ConnectFourWinner {
  Player1,
  Player2,
  Tie,
}

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

  private determineWinner(
    player1Sign: ConnectFourGameSign,
    player2Sign: ConnectFourGameSign,
  ): ConnectFourWinner {
    if (player1Sign === player2Sign) {
      return ConnectFourWinner.Tie;
    }
    if (
      (player1Sign === ConnectFourGameSign.Paper && player2Sign === ConnectFourGameSign.Rock) ||
      (player1Sign === ConnectFourGameSign.Scissors && player2Sign === ConnectFourGameSign.Paper) ||
      (player1Sign === ConnectFourGameSign.Rock && player2Sign === ConnectFourGameSign.Scissors)
    ) {
      return ConnectFourWinner.Player1;
    }
    return ConnectFourWinner.Player2;
  }

  public setStatus(timeout?: RpsTimeout): void {
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
        const winner = this.determineWinner(this.state.player1Sign, this.state.player2Sign);
        switch (winner) {
          case ConnectFourWinner.Player1:
            this.state.status = ConnectFourGameStatus.Player1Win;
            break;
          case ConnectFourWinner.Player2:
            this.state.status = ConnectFourGameStatus.Player2Win;
            break;
          case ConnectFourWinner.Tie:
            this.state.status = ConnectFourGameStatus.Draw;
            break;
          default:
            this.state.status = ConnectFourGameStatus.Unknown;
            break;
        }
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
        return 'Game in progress...';
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
Players: ${this.state.player1Username} vs. ${this.state.player2Username}
`,
      )
      .addFields([
        {
          name: 'Game Info',
          value: `
${this.getStatusAsString()}

${this.state.player1Username} picked: ${getEmojiFromSign(this.state.player1Sign)}
${this.state.player2Username} picked: ${getEmojiFromSign(this.state.player2Sign)}
`,
        },
      ]);
    // Buttons
    const row = new MessageActionRow().addComponents(
      new MessageButton().setCustomId('col1').setLabel('1').setStyle('SECONDARY'),
      new MessageButton().setCustomId('col2').setLabel('2').setStyle('SECONDARY'),
      new MessageButton().setCustomId('col3').setLabel('3').setStyle('SECONDARY'),
      new MessageButton().setCustomId('col4').setLabel('4').setStyle('SECONDARY'),
    );

    return {
      embeds: [embed],
      components: this.state.status === ConnectFourGameStatus.Pending ? [row] : [],
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
  Player1 = 1,
  Player2 = 3,
}

export const getEmojiFromSign = (sign: ConnectFourGameSign): string => {
  switch (sign) {
    case ConnectFourGameSign.Waiting:
      return '⚔️';
    case ConnectFourGameSign.Pending:
      return '❓';
    case ConnectFourGameSign.Player1:
      return '🔴';
    case ConnectFourGameSign.Player2:
      return '🔵';
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
};
