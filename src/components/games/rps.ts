import {
  ActionRowBuilder,
  ButtonStyle,
  Colors,
  ButtonBuilder,
  EmbedBuilder,
  User,
  BaseMessageOptions,
} from 'discord.js';
import { SapphireSentMessageType } from '../../codeyCommand';
import { getRandomIntFrom1 } from '../../utils/num';
import { adjustCoinBalanceByUserId, UserCoinEvent } from '../coin';
import { openDB } from '../db';
import { getCoinEmoji, getEmojiByName } from '../emojis';
import { CodeyUserError } from '../../codeyUserError';

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
        player2Username: player2User?.username ?? `Codey ${getEmojiByName('codey_love')}`,
        bet: bet,
        status: RpsGameStatus.Pending,
        player1Sign: RpsGameAction.Pending,
        player2Sign: RpsGameAction.Pending,
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
            -Math.floor(game.state.bet / 2),
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

export enum RpsGameEndReason {
  Player1TimeOut,
  Player2TimeOut,
  DuelRejected,
  GameCompleted,
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

  private determineWinner(player1Sign: RpsGameAction, player2Sign: RpsGameAction): RpsWinner {
    if (player1Sign === player2Sign) {
      return RpsWinner.Tie;
    }
    if (
      (player1Sign === RpsGameAction.Paper && player2Sign === RpsGameAction.Rock) ||
      (player1Sign === RpsGameAction.Scissors && player2Sign === RpsGameAction.Paper) ||
      (player1Sign === RpsGameAction.Rock && player2Sign === RpsGameAction.Scissors)
    ) {
      return RpsWinner.Player1;
    }
    return RpsWinner.Player2;
  }

  public setStatus(timeout?: RpsGameEndReason): void {
    // Both players submitted a sign
    switch (timeout) {
      case RpsGameEndReason.GameCompleted:
        /*
        If one of the players' signs is still (somehow) pending, game is still in progress
        */
        if (
          this.state.player1Sign === RpsGameAction.Pending ||
          this.state.player2Sign === RpsGameAction.Pending
        ) {
          this.state.status = RpsGameStatus.Pending;
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
        break;
      case RpsGameEndReason.DuelRejected:
        this.state.status = RpsGameStatus.DuelRejected;
        break;
      case RpsGameEndReason.Player1TimeOut:
        this.state.status = RpsGameStatus.Player1TimeOut;
        break;
      case RpsGameEndReason.Player2TimeOut:
        this.state.status = RpsGameStatus.Player2TimeOut;
        break;
      default:
        this.state.status = RpsGameStatus.Unknown;
        break;
    }
  }

  public getEmbedColor(): keyof typeof Colors {
    switch (this.state.status) {
      case RpsGameStatus.Player1Win:
        return 'Green';
      case RpsGameStatus.Player2Win:
        return this.state.player2Id ? 'Green' : 'Red';
      case RpsGameStatus.Draw:
        return 'Orange';
      default:
        return 'Yellow';
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
          return `The match ended in a draw, so ${
            this.state.player2Username
          } has taken ${Math.floor(this.state.bet / 2)} ${getCoinEmoji()} from ${
            this.state.player1Username
          }!`;
        } else {
          return `The match ended in a draw!`;
        }
      // Timeout can be implemented later
      default:
        return `Something went wrong! ${getEmojiByName('codey_sad')}`;
    }
  }

  // Prints embed and adds buttons for the game
  public getGameEmbed(): BaseMessageOptions {
    // Check to see if only one player has selected an option
    const awaitingPlayer =
      (this.state.player1Sign === RpsGameAction.Pending &&
        this.state.player2Sign !== RpsGameAction.Pending) ||
      (this.state.player1Sign !== RpsGameAction.Pending &&
        this.state.player2Sign === RpsGameAction.Pending);

    const embed = new EmbedBuilder()
      .setColor(this.getEmbedColor())
      .setTitle('Rock, Paper, Scissors!');

    if (awaitingPlayer) {
      embed.addFields([
        {
          name: 'Game Info',
          value: `
            ${this.getStatusAsString()}

            ${this.state.player1Username} picked: ${
            this.state.player1Sign === RpsGameAction.Pending
              ? getEmojiFromSign(this.state.player1Sign)
              : getEmojiFromSign(RpsGameAction.Selected)
          }
            ${this.state.player2Username} picked: ${
            this.state.player2Sign === RpsGameAction.Pending
              ? getEmojiFromSign(this.state.player2Sign)
              : getEmojiFromSign(RpsGameAction.Selected)
          }
          `,
        },
      ]);
    } else {
      embed.addFields([
        {
          name: 'Game Info',
          value: `
            ${this.getStatusAsString()}
            ${this.state.player1Username} picked: ${getEmojiFromSign(this.state.player1Sign)}
            ${this.state.player2Username} picked: ${getEmojiFromSign(this.state.player2Sign)}
          `,
        },
      ]);
    }
    // If player2 is NOT codey
    if (this.state.player2Id) {
      embed.setDescription(
        `
          Bet: ${this.state.bet} ${getCoinEmoji()}
          Players: ${this.state.player1Username} vs. ${this.state.player2Username}

          The loser will pay the winner the amount specified in the bet.
          In the event of a draw, no money will be exchanged.
        `,
      ); // someone please set a better description i cannot think of anything rn - ryann
    } else {
      embed.setDescription(
        `
          Bet: ${this.state.bet} ${getCoinEmoji()}
          Players: ${this.state.player1Username} vs. ${this.state.player2Username}

          If you win, you win your bet.
          If you lose, you lose your entire bet to Codey.
          If you draw, Codey takes 50% of your bet. 
          `,
      );
    }

    // Buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`rps-rock-${this.id}`)
        .setLabel(getEmojiFromSign(RpsGameAction.Rock))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`rps-paper-${this.id}`)
        .setLabel(getEmojiFromSign(RpsGameAction.Paper))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`rps-scissors-${this.id}`)
        .setLabel(getEmojiFromSign(RpsGameAction.Scissors))
        .setStyle(ButtonStyle.Secondary),
    );

    return {
      embeds: [embed],
      components: this.state.status === RpsGameStatus.Pending ? [row] : [],
    };
  }

  // Unlike getGameEmbed, this is to build the embed specifically for duel requests and rejections
  public getDuelEmbed(): BaseMessageOptions {
    const embed = new EmbedBuilder().setColor(this.getEmbedColor()).setTitle('RPS Duel Request!');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`rps-acceptduel-${this.id}`)
        .setLabel(getEmojiFromSign(RpsGameAction.AcceptDuel))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`rps-rejectduel-${this.id}`)
        .setLabel(getEmojiFromSign(RpsGameAction.RejectDuel))
        .setStyle(ButtonStyle.Secondary),
    );

    if (this.state.status === RpsGameStatus.DuelRejected) {
      embed.setDescription(
        `
          Bet: ${this.state.bet} ${getCoinEmoji()}
          Players: ${this.state.player1Username} vs. ${this.state.player2Username}

          ${this.state.player2Username} has rejected ${this.state.player1Username}'s RPS duel.
          `,
      );
    } else {
      embed.setDescription(
        `
          Bet: ${this.state.bet} ${getCoinEmoji()}
          Players: ${this.state.player1Username} vs. ${this.state.player2Username}

          ${this.state.player2Username}, ${
          this.state.player1Username
        } has challenged you to a RPS duel!
          Will you accept?
          `,
      );
    }
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
  DuelRejected = 6,
  Unknown = 7,
}

export enum RpsGameAction {
  Pending = 0,
  Rock = 1,
  Paper = 2,
  Scissors = 3,
  Selected = 4,
  AcceptDuel = 5,
  RejectDuel = 6,
}

export const getEmojiFromSign = (sign: RpsGameAction): string => {
  switch (sign) {
    case RpsGameAction.Pending:
      return '❓';
    case RpsGameAction.Rock:
      return '🪨';
    case RpsGameAction.Paper:
      return '📰';
    case RpsGameAction.Scissors:
      return '✂️';
    case RpsGameAction.Selected:
    case RpsGameAction.AcceptDuel:
      return '✅';
    case RpsGameAction.RejectDuel:
      return '❌';
  }
};

export type RpsGameState = {
  player1Id: string;
  player1Username: string;
  player2Id?: string;
  player2Username: string;
  bet: number;
  status: RpsGameStatus;
  player1Sign: RpsGameAction;
  player2Sign: RpsGameAction;
};

// Algorithm to get RPS game sign for Codey
export const getCodeyRpsSign = (): RpsGameAction => {
  return getRandomIntFrom1(3);
};
