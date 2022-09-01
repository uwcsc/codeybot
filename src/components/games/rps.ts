import { ColorResolvable, MessageActionRow, MessageButton, MessageEmbed, User } from 'discord.js';
import { SapphireMessageResponse, SapphireSentMessageType } from '../../codeyCommand';
import { getRandomIntFrom1 } from '../../utils/num';
import { adjustCoinBalanceByUserId, UserCoinEvent } from '../coin';
import { openDB } from '../db';
import { getCoinEmoji, getEmojiByName } from '../emojis';

class RpsGameTracker {
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
    Starts a RPS game
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
        player2Username: player2User?.username ?? `Codey ${getEmojiByName('codeyLove')}`,
        bet: bet,
        status: RpsGameStatus.Pending,
        player1Sign: RpsGameSign.Pending,
        player2Sign: RpsGameSign.Pending,
      };
      const game = new RpsGame(id!, channelId, state);
      this.games.set(id, game);
      return game;
    }
    throw new Error('Something went wrong with starting the RPS game');
  }

  async endGame(gameId: number): Promise<void> {
    const db = await openDB();
    const game = this.getGameFromId(gameId);
    if (!game) {
      throw new Error(`No game with game ID ${gameId} found`);
    }
    // Don't do anything if game status is still pending
    if (game.state.status === RpsGameStatus.Pending) return;
    // Update winnings
    switch (game.state.status) {
      case RpsGameStatus.Player1Win:
        await adjustCoinBalanceByUserId(game.state.player1Id, game.state.bet, UserCoinEvent.RpsWin);
        if (game.state.player2Id) {
          await adjustCoinBalanceByUserId(
            game.state.player2Id,
            -game.state.bet,
            UserCoinEvent.RpsLoss,
          );
        }
        break;
      case RpsGameStatus.Player2Win:
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
      case RpsGameStatus.Draw:
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
    rpsGameTracker.games.delete(gameId);
  }
}

export const rpsGameTracker = new RpsGameTracker();

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

  private determineWinner(player1Sign: RpsGameSign, player2Sign: RpsGameSign): RpsWinner {
    if (player1Sign === player2Sign) {
      return RpsWinner.Tie;
    }
    if (
      (player1Sign === RpsGameSign.Paper && player2Sign === RpsGameSign.Rock) ||
      (player1Sign === RpsGameSign.Scissors && player2Sign === RpsGameSign.Paper) ||
      (player1Sign === RpsGameSign.Rock && player2Sign === RpsGameSign.Scissors)
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
        this.state.player1Sign === RpsGameSign.Pending ||
        this.state.player2Sign === RpsGameSign.Pending
      ) {
        this.state.status = RpsGameStatus.Unknown;
      } else {
        const winner = this.determineWinner(this.state.player1Sign, this.state.player2Sign);
        switch (winner) {
          case RpsWinner.Player1:
            this.state.status = RpsGameStatus.Player1Win;
            break;
          case RpsWinner.Player2:
            this.state.status = RpsGameStatus.Player2Win;
            break;
          case RpsWinner.Tie:
            this.state.status = RpsGameStatus.Draw;
            break;
          default:
            this.state.status = RpsGameStatus.Unknown;
            break;
        }
      }
    } else if (timeout === RpsTimeout.Player1) {
      this.state.status = RpsGameStatus.Player1TimeOut;
    } else if (timeout === RpsTimeout.Player2) {
      this.state.status = RpsGameStatus.Player2TimeOut;
    } else {
      this.state.status = RpsGameStatus.Unknown;
    }
  }

  public getEmbedColor(): ColorResolvable {
    switch (this.state.status) {
      case RpsGameStatus.Player1Win:
        return 'GREEN';
      case RpsGameStatus.Player2Win:
        return this.state.player2Id ? 'GREEN' : 'RED';
      case RpsGameStatus.Draw:
        return 'ORANGE';
      default:
        return 'YELLOW';
    }
  }

  public getStatusAsString(): string {
    switch (this.state.status) {
      case RpsGameStatus.Pending:
        return 'Game in progress...';
      case RpsGameStatus.Player1Win:
        return `${this.state.player1Username} has won, and wins ${
          this.state.bet
        } ${getCoinEmoji()} from ${this.state.player2Username}!`;
      case RpsGameStatus.Player2Win:
        return `${this.state.player2Username} has won, and wins ${
          this.state.bet
        } ${getCoinEmoji()} from ${this.state.player1Username}!`;
      case RpsGameStatus.Draw:
        if (!this.state.player2Id) {
          return `The match ended in a draw, so ${this.state.player2Username} has taken ${
            this.state.bet / 2
          } ${getCoinEmoji()} from ${this.state.player1Username}!`;
        } else {
          return `The match ended in a draw!`;
        }
      // Timeout can be implemented later
      default:
        return `Something went wrong! ${getEmojiByName('codeySad')}`;
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
        .setLabel(getEmojiFromSign(RpsGameSign.Rock))
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId(`rps-paper-${this.id}`)
        .setLabel(getEmojiFromSign(RpsGameSign.Paper))
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId(`rps-scissors-${this.id}`)
        .setLabel(getEmojiFromSign(RpsGameSign.Scissors))
        .setStyle('SECONDARY'),
    );

    return {
      embeds: [embed],
      components: this.state.status === RpsGameStatus.Pending ? [row] : [],
    };
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

export const getEmojiFromSign = (sign: RpsGameSign): string => {
  switch (sign) {
    case RpsGameSign.Pending:
      return '❓';
    case RpsGameSign.Rock:
      return '🪨';
    case RpsGameSign.Paper:
      return '📰';
    case RpsGameSign.Scissors:
      return '✂️';
  }
};

export type RpsGameState = {
  player1Id: string;
  player1Username: string;
  player2Id?: string;
  player2Username: string;
  bet: number;
  status: RpsGameStatus;
  player1Sign: RpsGameSign;
  player2Sign: RpsGameSign;
};

// Algorithm to get RPS game sign for Codey
export const getCodeyRpsSign = (): RpsGameSign => {
  return getRandomIntFrom1(3);
};
