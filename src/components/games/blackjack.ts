import { actions, Game, Card, Action } from 'engine-blackjack-ts';
import _ from 'lodash';

type BlackjackGame = { channelId: string; game: Game; startedAt: Date };

export type BlackjackHand = Card[];

export type GameState = {
  stage: BlackjackStage;
  playerCards: BlackjackHand;
  playerValue: number[];
  dealerCards: BlackjackHand;
  dealerValue: number[];
  bet: number;
  amountWon: number;
  surrendered: boolean;
};

export enum BlackjackAction {
  HIT = 'HIT',
  STAND = 'STAND',
  QUIT = 'QUIT'
}

export enum BlackjackStage {
  PLAYER_TURN = 'PLAYER_TURN',
  DONE = 'DONE',
  UNKNOWN = 'UNKNOWN'
}

export enum CardSuit {
  SPADES = 'spades',
  HEARTS = 'hearts',
  CLUBS = 'clubs',
  DIAMONDS = 'diamonds'
}

const defaultPosition = 'right';
const gamesByPlayerId = new Map<string, BlackjackGame>();
const gameActionsMap = new Map<BlackjackAction, () => Action>([
  [BlackjackAction.HIT, () => actions.hit({ position: defaultPosition })],
  [BlackjackAction.STAND, () => actions.stand({ position: defaultPosition })],
  [BlackjackAction.QUIT, actions.surrender]
]);
const gameStageMap = new Map<string, BlackjackStage>([
  ['player-turn-right', BlackjackStage.PLAYER_TURN], // STAGE_PLAYER_TURN_RIGHT
  ['done', BlackjackStage.DONE] // STAGE_DONE
]);

const getGameState = (game: Game): GameState => {
  const { dealerCards, initialBet, dealerValue, handInfo, stage, wonOnRight } = game.getState();
  const { cards: playerCards, playerValue } = handInfo.right;

  const state = {
    stage: gameStageMap.get(stage) || BlackjackStage.UNKNOWN,
    playerCards,
    playerValue: _.uniq(Object.values(playerValue)),
    dealerCards,
    dealerValue: _.uniq(Object.values(dealerValue)),
    bet: initialBet,
    amountWon: wonOnRight,
    surrendered: handInfo.right.playerHasSurrendered
  } as GameState;

  return state;
};

export const blackjackGamesByUser = new Map<string, BlackjackGame>();

export const startGame = (amount: number, playerId: string, channelId: string): GameState | null => {
  // If a game was started in the last minute, don't start a new one.
  if (gamesByPlayerId.has(playerId)) {
    const startedAt = gamesByPlayerId.get(playerId)?.startedAt.getTime();
    const now = new Date().getTime();
    if (startedAt && now - startedAt < 60000) {
      return null;
    }
  }
  const game = new Game();
  gamesByPlayerId.set(playerId, { channelId, game, startedAt: new Date() });
  game.dispatch(actions.deal({ bet: amount }));
  return getGameState(game);
};

export const endGame = (playerId: string): void => {
  gamesByPlayerId.delete(playerId);
};

export const performGameAction = (playerId: string, actionName: BlackjackAction): GameState | null => {
  const game = gamesByPlayerId.get(playerId)?.game;
  const gameAction = gameActionsMap.get(actionName);
  if (!game || !gameAction) return null;
  game.dispatch(gameAction());
  return getGameState(game);
};