import { ColorResolvable, MessageActionRow, MessageButton, MessageEmbed, User } from 'discord.js';
import { SapphireMessageResponse, SapphireSentMessageType } from '../../codeyCommand';
import { getRandomIntFrom1 } from '../../utils/num';
import { adjustCoinBalanceByUserId, UserCoinEvent } from '../coin';
import { openDB } from '../db';
import { getCoinEmoji, getEmojiByName } from '../emojis';
import { CodeyUserError } from '../../codeyUserError';
class ConnectFourGameTracker {
  // Key = id, Value = game
  games: Map<number, RpsGame>;

  constructor() {
    this.games = new Map<number, RpsGame>();
  }

  getGameFromId(id: number): RpsGame | undefined {
    return this.games.get(id);
  }

  runFuncOnGame(gameId: number, func: (game: RpsGame) => void): void {
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
  ): Promise<RpsGame> {
    const db = await openDB();
    const result = await db.run(
      `
    INSERT INTO rps_game_info (player1_id, player2_id, bet)
    VALUES (?, ?, ?)
  `,
      player1User.id,
      player2User?.id,
      bet,
    );
    // get last inserted ID
    const id = result.lastID;
    if (id) {
      const state: RpsGameState = {
        player1Id: player1User.id,
        player1Username: player1User.username,
        player2Id: player2User?.id,
        player2Username: player2User?.username ?? `Codey ${getEmojiByName('codey_love')}`,
        bet: bet,
        status: ConnectFourGameStatus.Pending,
        player1Sign: ConnectFourGameSign.Pending,
        player2Sign: ConnectFourGameSign.Pending,
      };
      const game = new RpsGame(id!, channelId, state);
      this.games.set(id, game);
      return game;
    }
    throw new CodeyUserError(undefined, 'Something went wrong with starting the RPS game');
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
    switch (game.state.status) {
      case ConnectFourGameStatus.Player1Win:
        await adjustCoinBalanceByUserId(game.state.player1Id, game.state.bet, UserCoinEvent.RpsWin);
        if (game.state.player2Id) {
          await adjustCoinBalanceByUserId(
            game.state.player2Id,
            -game.state.bet,
            UserCoinEvent.RpsLoss,
          );
        }
        break;
      case ConnectFourGameStatus.Player2Win:
        await adjustCoinBalanceByUserId(
          game.state.player1Id,
          -game.state.bet,
          UserCoinEvent.RpsLoss,
        );
        if (game.state.player2Id) {
          await adjustCoinBalanceByUserId(
            game.state.player2Id,
            game.state.bet,
            UserCoinEvent.RpsWin,
          );
        }
        break;
      case ConnectFourGameStatus.Draw:
        if (!game.state.player2Id) {
          await adjustCoinBalanceByUserId(
            game.state.player1Id,
            -game.state.bet / 2,
            UserCoinEvent.RpsDrawAgainstCodey,
          );
        }
        break;
    }
    await db.run(
      `
      UPDATE rps_game_info
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

export enum RpsWinner {
  Player1,
  Player2,
  Tie,
}

export enum RpsTimeout {
  Player1,
  Player2,
}

export class RpsGame {
  id: number;
  channelId: string;
  gameMessage!: SapphireSentMessageType;
  state: RpsGameState;

  constructor(id: number, channelId: string, state: RpsGameState) {
    this.id = id;
    this.channelId = channelId;
    this.state = state;
  }

  private determineWinner(
    player1Sign: ConnectFourGameSign,
    player2Sign: ConnectFourGameSign,
  ): RpsWinner {
    if (player1Sign === player2Sign) {
      return RpsWinner.Tie;
    }
    if (
      (player1Sign === ConnectFourGameSign.Paper && player2Sign === ConnectFourGameSign.Rock) ||
      (player1Sign === ConnectFourGameSign.Scissors && player2Sign === ConnectFourGameSign.Paper) ||
      (player1Sign === ConnectFourGameSign.Rock && player2Sign === ConnectFourGameSign.Scissors)
    ) {
      return RpsWinner.Player1;
    }
    return RpsWinner.Player2;
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
          case RpsWinner.Player1:
            this.state.status = ConnectFourGameStatus.Player1Win;
            break;
          case RpsWinner.Player2:
            this.state.status = ConnectFourGameStatus.Player2Win;
            break;
          case RpsWinner.Tie:
            this.state.status = ConnectFourGameStatus.Draw;
            break;
          default:
            this.state.status = ConnectFourGameStatus.Unknown;
            break;
        }
      }
    } else if (timeout === RpsTimeout.Player1) {
      this.state.status = ConnectFourGameStatus.Player1TimeOut;
    } else if (timeout === RpsTimeout.Player2) {
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
        return `${this.state.player1Username} has won, and wins ${
          this.state.bet
        } ${getCoinEmoji()} from ${this.state.player2Username}!`;
      case ConnectFourGameStatus.Player2Win:
        return `${this.state.player2Username} has won, and wins ${
          this.state.bet
        } ${getCoinEmoji()} from ${this.state.player1Username}!`;
      case ConnectFourGameStatus.Draw:
        if (!this.state.player2Id) {
          return `The match ended in a draw, so ${this.state.player2Username} has taken ${
            this.state.bet / 2
          } ${getCoinEmoji()} from ${this.state.player1Username}!`;
        } else {
          return `The match ended in a draw!`;
        }
      // Timeout can be implemented later
      default:
        return `Something went wrong! ${getEmojiByName('codey_sad')}`;
    }
  }

  // Prints embed and adds buttons for the game
  public getGameResponse(): SapphireMessageResponse {
    const embed = new MessageEmbed()
      .setColor(this.getEmbedColor())
      .setTitle('Rock, Paper, Scissors!')
      .setDescription(
        `
Bet: ${this.state.bet} ${getCoinEmoji()}
Players: ${this.state.player1Username} vs. ${this.state.player2Username}

If you win, you win your bet.
If you lose, you lose your entire bet to Codey.
If you draw, Codey takes 50% of your bet.
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
      new MessageButton()
        .setCustomId(`rps-rock-${this.id}`)
        .setLabel(getEmojiFromSign(ConnectFourGameSign.Rock))
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId(`rps-paper-${this.id}`)
        .setLabel(getEmojiFromSign(ConnectFourGameSign.Paper))
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId(`rps-scissors-${this.id}`)
        .setLabel(getEmojiFromSign(ConnectFourGameSign.Scissors))
        .setStyle('SECONDARY'),
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

export type RpsGameState = {
  player1Id: string;
  player1Username: string;
  player2Id?: string;
  player2Username: string;
  bet: number;
  status: ConnectFourGameStatus;
  player1Sign: ConnectFourGameSign;
  player2Sign: ConnectFourGameSign;
};

// Algorithm to get RPS game sign for Codey
export const getCodeyRpsSign = (): ConnectFourGameSign => {
  return getRandomIntFrom1(3);
};
