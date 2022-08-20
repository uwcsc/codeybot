import { Action, actions, Card, Game, presets } from 'engine-blackjack-ts';
import _ from 'lodash';

const PLAYER_DEFAULT_POSITION = 'right';

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
  QUIT = 'QUIT',
}

export enum BlackjackStage {
  PLAYER_TURN = 'PLAYER_TURN',
  DONE = 'DONE',
  UNKNOWN = 'UNKNOWN',
}

export enum CardSuit {
  SPADES = 'spades',
  HEARTS = 'hearts',
  CLUBS = 'clubs',
  DIAMONDS = 'diamonds',
}

// keeps track of games by player's Discord IDs
const gamesByPlayerId = new Map<string, BlackjackGame>();

// maps action Enum to game action
const gameActionsMap = new Map<BlackjackAction, () => Action>([
  [BlackjackAction.HIT, () => actions.hit({ position: PLAYER_DEFAULT_POSITION })],
  [BlackjackAction.STAND, () => actions.stand({ position: PLAYER_DEFAULT_POSITION })],
  [BlackjackAction.QUIT, actions.surrender],
]);

// maps game stage string to stage Enum
const gameStageMap = new Map<string, BlackjackStage>([
  ['player-turn-right', BlackjackStage.PLAYER_TURN], // STAGE_PLAYER_TURN_RIGHT
  ['done', BlackjackStage.DONE], // STAGE_DONE
]);

// modify the given blackjack rules to our own custom rules
const defaultGameRules = presets.getRules({
  double: 'none',
  split: false,
  insurance: false,
});

/*
  Extract game state from engine-blackjack-ts's game state
*/
const getGameState = (game: Game): GameState => {
  const { dealerCards, initialBet, dealerValue, handInfo, stage, wonOnRight } = game.getState();
  const { cards: playerCards, playerValue } = handInfo.right;

  const state = {
    stage: gameStageMap.get(stage) || BlackjackStage.UNKNOWN,
    playerCards,
    playerValue: _.uniq(Object.values(playerValue)), // e.g. {hi: 10, low: 10} => [10]
    dealerCards,
    dealerValue: _.uniq(Object.values(dealerValue)),
    bet: initialBet,
    amountWon: Math.floor(wonOnRight), // e.g. do not allow decimals
    surrendered: handInfo.right.playerHasSurrendered,
  } as GameState;

  return state;
};

/*
  Starts a blackjack game for a given player and returns the new game's state
*/
export const startGame = (
  amount: number,
  playerId: string,
  channelId: string,
): GameState | null => {
  // if player started a game more than a minute ago, allow them to start another one in case the game got stuck
  if (gamesByPlayerId.has(playerId)) {
    // player already has a game in progress, get the start time of the existing game
    const startedAt = gamesByPlayerId.get(playerId)?.startedAt.getTime();
    const now = new Date().getTime();
    if (startedAt && now - startedAt < 60000) {
      // game was started in the past minute, don't start a new one
      return null;
    }
  }

  // start the game
  const game = new Game(undefined, defaultGameRules);
  gamesByPlayerId.set(playerId, { channelId, game, startedAt: new Date() });
  game.dispatch(actions.deal({ bet: amount }));
  return getGameState(game);
};

/*
  End blackjack game for a given player
*/
export const endGame = (playerId: string): void => {
  gamesByPlayerId.delete(playerId);
};

/*
  Perform a player action and returns the game state after that action
*/
export const performGameAction = (
  playerId: string,
  actionName: BlackjackAction,
): GameState | null => {
  // get game and action
  const game = gamesByPlayerId.get(playerId)?.game;
  const gameAction = gameActionsMap.get(actionName);

  if (!game || !gameAction) {
    // no game state if game does not exist or if action is in valid
    return null;
  }

  // perform action
  game.dispatch(gameAction());
  return getGameState(game);
};
