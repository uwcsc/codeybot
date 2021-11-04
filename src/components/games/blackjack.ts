import { actions, Game, Card } from 'engine-blackjack-ts';
import _ from 'lodash';

type BlackjackGame = { channelId: string; game: Game };

export type BlackjackHand = Card[];

export enum CardSuit {
  SPADES = 'spades',
  HEARTS = 'hearts',
  CLUBS = 'clubs',
  DIAMONDS = 'diamonds'
}

type GameState = {
  stage: string;
  playerCards: BlackjackHand;
  playerValue: number[];
  dealerCards: BlackjackHand;
  dealerValue: number[];
  bet: number;
};

const getGameState = (game: Game): GameState => {
  const { dealerCards, initialBet, dealerValue, handInfo, stage } = game.getState();
  const { cards: playerCards, playerValue } = handInfo.right;
  const state = {
    stage,
    playerCards,
    playerValue: _.uniq(Object.values(playerValue)),
    dealerCards,
    dealerValue: _.uniq(Object.values(dealerValue)),
    bet: initialBet
  } as GameState;

  return state;
};

export const blackjackGamesByUser = new Map<string, BlackjackGame>();

export const startGame = (amount: number): GameState => {
  const game = new Game();
  game.dispatch(actions.deal({ bet: amount }));
  return getGameState(game);
};
