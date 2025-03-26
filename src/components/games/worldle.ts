import axios from 'axios';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import _ from 'lodash';

export type WorldleGame = {
  channelId: string;
  targetCountry: Country;
  guessedCountries: Guess[];
  startedAt: Date;
  maxAttempts: number;
  gameOver: boolean;
  won: boolean;
};

export type Country = {
  name: string;
  code: string;
  capital: string;
  continent: string;
  latlng: [number, number];
};

export type Guess = {
  country: Country;
  distance: number;
  direction: string;
  percentage: number;
};

export enum WorldleAction {
  GUESS = 'GUESS',
  HINT = 'HINT',
  QUIT = 'QUIT',
}

export enum WorldleStage {
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export interface CountryAPI {
  name: {
    common: string;
  };
  cca2: string;
  capital?: string[];
  region: string;
  latlng?: number[];
}

const MAX_ATTEMPTS = 4;
const COUNTRIES_API_URL = 'https://restcountries.com/v3.1/all';
const EARTH_RADIUS = 6371; // km

// keep track of games by discord ids
export const worldleGamesByPlayerId = new Map<string, WorldleGame>();

let countriesCache: Country[] = [];

export const hintButton = new ButtonBuilder()
  .setCustomId('hint')
  .setLabel('Hint')
  .setEmoji('💡')
  .setStyle(ButtonStyle.Primary);

export const quitButton = new ButtonBuilder()
  .setCustomId('quit')
  .setLabel('Quit')
  .setEmoji('🚪')
  .setStyle(ButtonStyle.Danger);

export const gameActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  hintButton,
  quitButton,
);

// calculates distance between two coordinates
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS * c);
};

// calculate direction between 2 points
export const calculateDirection = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): string => {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  let angle = Math.atan2(dLat, dLon) * (180 / Math.PI);

  // Convert to 0-360 range
  if (angle < 0) {
    angle += 360;
  }

  // Convert angle to cardinal direction
  const directions = ['🡺 E', '🡽 NE', '🡹 N', '🡼 NW', '🡸 W', '🡿 SW', '🡻 S', '🡾 SE'];
  return directions[Math.round(angle / 45) % 8];
};

// calculates proximity percentage
// * 0% = far, 100% = correct *
export const calculateProximity = (distance: number): number => {
  // Max considered distance (half Earth circumference ~20,000km)
  const MAX_DISTANCE = 10000;
  const percentage = Math.max(0, 100 - Math.round((distance / MAX_DISTANCE) * 100));
  return percentage;
};

// fetch countries data
export const fetchCountries = async (): Promise<Country[]> => {
  if (countriesCache.length > 0) {
    return countriesCache;
  }

  try {
    const response = await axios.get(COUNTRIES_API_URL);
    const data = response.data;

    // eslint-disable-next-line
    countriesCache = data.map((country: any) => ({
      name: country.name.common,
      code: country.cca2,
      capital: country.capital?.[0] || 'Unknown',
      continent: country.region || 'Unknown',
      latlng: country.latlng || [0, 0],
    }));

    return countriesCache;
  } catch (error) {
    return [];
  }
};

// try to find country by name
export const findCountryByName = (name: string): Country | null => {
  if (countriesCache.length === 0) {
    return null;
  }

  // try exact match
  const exactMatch = countriesCache.find((c) => c.name.toLowerCase() === name.toLowerCase());

  if (exactMatch) {
    return exactMatch;
  }

  // if no exact match, try partial match
  const partialMatch = countriesCache.find(
    (c) =>
      c.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(c.name.toLowerCase()),
  );

  return partialMatch || null;
};

// start a new Worldle game
export const startWorldleGame = async (
  playerId: string,
  channelId: string,
): Promise<WorldleGame | null> => {
  // check if player already has an active game
  if (worldleGamesByPlayerId.has(playerId)) {
    const currentGame = worldleGamesByPlayerId.get(playerId)!;
    const now = new Date().getTime();

    // if game is in progress and started less than a minute ago, don't start a new one
    if (!currentGame.gameOver && now - currentGame.startedAt.getTime() < 60000) {
      return null;
    }
  }

  // ensures countries data is loaded
  await fetchCountries();
  if (countriesCache.length === 0) {
    return null;
  }

  // select a random country
  const targetCountry = _.sample(countriesCache)!;

  // create new game
  const game: WorldleGame = {
    channelId,
    targetCountry,
    guessedCountries: [],
    startedAt: new Date(),
    maxAttempts: MAX_ATTEMPTS,
    gameOver: false,
    won: false,
  };

  worldleGamesByPlayerId.set(playerId, game);
  return game;
};

// process a guess
export const makeGuess = (
  playerId: string,
  countryName: string,
): { game: WorldleGame | null; guess: Guess | null; error?: string } => {
  const game = worldleGamesByPlayerId.get(playerId);
  if (!game) {
    return { game: null, guess: null, error: 'No active game found.' };
  }

  if (game.gameOver) {
    return { game, guess: null, error: 'Game is already over.' };
  }

  if (game.guessedCountries.length >= game.maxAttempts) {
    game.gameOver = true;
    return { game, guess: null, error: 'Maximum attempts reached.' };
  }

  // find country by name
  const guessedCountry = findCountryByName(countryName);
  if (!guessedCountry) {
    return { game, guess: null, error: 'Country not found. Try another name.' };
  }

  // check if country was already guessed
  if (game.guessedCountries.some((g) => g.country.code === guessedCountry.code)) {
    return { game, guess: null, error: 'You already guessed this country.' };
  }

  // calculate distance and direction
  const distance = calculateDistance(
    game.targetCountry.latlng[0],
    game.targetCountry.latlng[1],
    guessedCountry.latlng[0],
    guessedCountry.latlng[1],
  );

  const direction = calculateDirection(
    guessedCountry.latlng[0],
    guessedCountry.latlng[1],
    game.targetCountry.latlng[0],
    game.targetCountry.latlng[1],
  );

  const percentage = calculateProximity(distance);

  // create guess object
  const guess: Guess = {
    country: guessedCountry,
    distance,
    direction,
    percentage,
  };

  // add guess to game
  game.guessedCountries.push(guess);

  // check if guess is correct
  if (guessedCountry.code === game.targetCountry.code) {
    game.gameOver = true;
    game.won = true;
  } else if (game.guessedCountries.length >= game.maxAttempts) {
    game.gameOver = true;
  }

  return { game, guess };
};

// get hint for current game
export const getHint = (playerId: string): { hint: string; hintNumber: number } | null => {
  const game = worldleGamesByPlayerId.get(playerId);
  if (!game) {
    return null;
  }

  const hintNumber = game.guessedCountries.length;
  let hint = '';

  switch (hintNumber) {
    case 0:
      hint = `Continent: ${game.targetCountry.continent}`;
      break;
    case 1:
      hint = `First letter: ${game.targetCountry.name[0]}`;
      break;
    case 2:
      hint = `Capital: ${game.targetCountry.capital}`;
      break;
    case 3:
      hint = `Number of letters: ${game.targetCountry.name.length}`;
      break;
    default:
      // unreachable
      hint = `The country is ${game.targetCountry.name}`;
  }

  return { hint, hintNumber: hintNumber + 1 };
};

// terminate game
export const endWorldleGame = (playerId: string): void => {
  worldleGamesByPlayerId.delete(playerId);
};

// perform game action
export const performWorldleAction = (
  playerId: string,
  actionName: WorldleAction,
  data?: string,
  // eslint-disable-next-line
): any => {
  switch (actionName) {
    case WorldleAction.GUESS:
      return makeGuess(playerId, data || '');
    case WorldleAction.HINT:
      return getHint(playerId);
    case WorldleAction.QUIT:
      const game = worldleGamesByPlayerId.get(playerId);
      if (game) {
        game.gameOver = true;
      }
      return { game };
    default:
      return null;
  }
};

// Get progress bars based on percentage
export const getProgressBar = (percentage: number): string => {
  const filledCount = Math.round(percentage / 10);
  const emptyCount = 10 - filledCount;

  return '🟩'.repeat(filledCount) + '⬜'.repeat(emptyCount);
};
