import { openDB } from '../db';
import { logger } from '../../logger/default';
import { MessageActionRow, MessageButton, MessageEmbed, MessagePayload, User } from 'discord.js';
import { getCoinEmoji, getEmojiByName } from '../emojis';
import { SapphireMessageResponse, SapphireSentMessageType } from '../../codeyCommand';

class RpsGameTracker {
  // Key = id, Value = game
  games: Map<number, RpsGame>;

  constructor() {
    this.games = new Map<number, RpsGame>();
  }

  getGameFromId(id: number): RpsGame | undefined {
    return this.games.get(id);
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
      [player1User.id, player2User?.id, bet],
    );
    // get last inserted ID
    const id = result.lastID;
    if (id) {
      const state: RpsGameState = {
        player1Id: player1User.id,
        player1Username: player1User.username,
        player2Id: player2User?.id,
        player2Username: player2User?.username ?? `Codey ${getEmojiByName('codeyLove')}`,
        bet,
        status: 0,
        player1Sign: 0,
        player2Sign: 0,
      };
      const game = new RpsGame(id!, channelId, state);
      this.games.set(id, game);
      return game;
    }
    throw new Error('Something went wrong when starting the RPS game');
  }
}

export const rpsGameTracker = new RpsGameTracker();

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

  public getStatus(timeout: 'player1' | 'player2' | null): RpsGameStatus {
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

  // Prints embed and buttons for the game
  public getGameResponse(): SapphireMessageResponse {
    const embed = new MessageEmbed()
      .setColor('YELLOW')
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
Game in progress...

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
      components: [row],
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

const getEmojiFromSign = (sign: RpsGameSign): string => {
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
