import { Client } from 'discord.js-commando';
import { Database } from 'sqlite';
import { openDB } from './db';
import _ from 'lodash';
import { Person, stableMarriage } from 'stable-marriage';

const COFFEE_ROLE_ID: string = process.env.COFFEE_ROLE_ID || '.';
const TARGET_GUILD_ID: string = process.env.TARGET_GUILD_ID || '.';
const RANDOM_ITERATIONS = 1000;

interface historic_match {
  first_user_id: string;
  second_user_id: string;
  TIMESTAMP: string;
}

interface future_match {
  first_user_id: string;
  second_user_id: string;
  week_id: number;
}

/*
 *Adds new matches into the future match database with the corresponding week_id
 *Then adds the fresh week of matches into the week_status database
 */
const writeFutureMatches = async (results: string[][], week: number): Promise<void> => {
  const db = await openDB();
  await db.run(
    `INSERT INTO coffee_future_matches (first_user_id, second_user_id, week_id) VALUES${_.join(
      results.map((entry) => `('${entry[0]}', '${entry[1]}', ${week})`),
      ','
    )};
  )`
  );
  await db.run(`INSERT INTO coffee_week_status (week_id, finished) VALUES (${week}, FALSE);`);
};

export const initCoffeeChatTables = async (db: Database): Promise<void> => {
  //Database to store past matches, with TIMESTAMP being the time matches were written into DB
  await db.run(
    `
        CREATE TABLE IF NOT EXISTS coffee_historic_matches (
            first_user_id TEXT NOT NULL,
            second_user_id TEXT NOT NULL,
            date TIMESTAMP NOT NULL
        )
        `
  );
  //Database to store finished status of future weeks
  await db.run(
    `
        CREATE TABLE IF NOT EXISTS coffee_week_status (
            week_id INTEGER PRIMARY KEY,
            finished BOOL NOT NULL
        )
        `
  );
  //Stores potential future matches, grouped by the week_id that they are generated for
  //Effectiveness of these matches are only guaranteed if all matches of the same week are used at once.
  await db.run(
    `
        CREATE TABLE IF NOT EXISTS coffee_future_matches (
            first_user_id TEXT NOT NULL,
            second_user_id TEXT NOT NULL,
            week_id INTEGER NOT NULL
        )
        `
  );
};

/*
 * Generates future matches for users currently "enrolled" into coffee chats until a duplicate match is encountered
 * OVERWRITES Coffee_future_matches and coffee_week_status with new matches
 * Returns number of new weeks of matchings generated
 */
export const generateFutureMatches = async (client: Client): Promise<number> => {
  //reset tables
  await wipeHistory('coffee_future_matches');
  await wipeHistory('coffee_week_status');

  //get list of users and their historic chat history
  const userList = await loadNotMatched(client);
  const matched = await loadMatched(userList);

  const newMatches: number[][] = Array.from(Array(userList.size), () => new Array(4).fill(0));
  for (let i = 0; true; i++) {
    //generate one week of matches, and updates match freq tables accordingly
    const nextResults = stableMatch(userList, matched);
    for (const pair of nextResults) {
      matched[userList.get(pair[0])!][userList.get(pair[1])!]++;
      matched[userList.get(pair[1])!][userList.get(pair[0])!]++;
      newMatches[userList.get(pair[0])!][userList.get(pair[1])!]++;
      newMatches[userList.get(pair[1])!][userList.get(pair[0])!]++;
    }

    //stops and returns if most recent match caused a duplicate matching to appear
    if (hasDupe(newMatches, nextResults, userList)) {
      return i;
    }

    //if no dupe, write this new match to results and continue generating
    await writeFutureMatches(nextResults, i);
  }
};

/*
 * Get the ID's of users for which future matches was generated for
 * Returns the above as a array of strings
 */
const getFutureMatchIDs = async (): Promise<string[]> => {
  const db = await openDB();
  return (
    await db.all(
      `SELECT first_user_id FROM coffee_future_matches UNION SELECT second_user_id FROM coffee_future_matches`
    )
  ).map((val) => val['first_user_id']);
};

//tests if generated matches still work for people wanting a match
//and if unused generated matches still remain
export const validateFutureMatches = async (client: Client): Promise<boolean> => {
  const db = await openDB();

  //check if the ID's of users CURRENTLY wanting coffee chats are the same as the
  //users we have generated matches for
  const activeMatchIDs = [...(await loadNotMatched(client)).keys()];
  const generatedMatchIDs = await getFutureMatchIDs();

  //checks if same amount of ID's on both sides, then checks that they are equal
  if (activeMatchIDs.length != generatedMatchIDs.length) return false;
  for (const key of activeMatchIDs) {
    if (!generatedMatchIDs.includes(key)) return false;
  }

  //test if there exists week_id that is not finished
  const test_id = await db.get(`SELECT * FROM coffee_week_status WHERE finished = 0`);
  if (!test_id) return false;

  return true;
};

/*
 * Pulls the next round of pre-generated matches
 * ONLY run this is you know there still exists at least one more round of valid matches
 * Verify this by running validdateFutureMatches prior to this
 * Return an array of matches (themselves an array of size 2); potential "single" person's ID will be returned in single, null otherwise
 */
export const getNextFutureMatch = async (client: Client): Promise<{ matches: string[][]; single: string | null }> => {
  const db = await openDB();

  //get matches for the smallest week_id that hasn't been used, then set the week_id to be used
  const { week_id } = (await db.get(`SELECT min(week_id) AS week_id FROM coffee_week_status WHERE finished = 0;`)) as {
    week_id: number;
  };
  const matches = ((await db.all(
    `SELECT * FROM coffee_future_matches WHERE week_id = ${week_id};`
  )) as future_match[]).map((entry) => [entry.first_user_id, entry.second_user_id]);
  await db.run(`UPDATE coffee_week_status SET finished = 1 WHERE week_id = ${week_id};`);

  //attempts to find a single by seeing if there's an ID that wants to be matched
  //but isn't present in the match
  const activeMatchIDs = [...(await loadNotMatched(client)).keys()];
  let single: string | null = null;
  if (activeMatchIDs.length % 2 == 1) {
    const usedIDs = _.flatten(matches);
    for (const key of activeMatchIDs) {
      if (!usedIDs.includes(key)) {
        single = key;
        break;
      }
    }
  }
  return { matches: matches, single: single };
};

/*
 * Gets the list of users that are currently "enrolled" in coffee chat
 * Returns a mapping of string -> int, where string is their ID, while int is an index assigned to the ID
 * The index is used in place of the ID for match tallying
 */
const loadNotMatched = async (client: Client): Promise<Map<string, number>> => {
  //gets list of users with the coffee chat role
  const userList = (await (await client.guilds.fetch(TARGET_GUILD_ID)).members.fetch())
    ?.filter((member) => member.roles.cache.has(COFFEE_ROLE_ID))
    .map((member) => member.user.id);

  //assigns each user ID a unique index
  const notMatched: Map<string, number> = new Map();
  userList.forEach((val: string, index: number) => {
    notMatched.set(val, index);
  });
  return notMatched;
};

/*
 * Checks if a match happened more than once in the tally
 */
const hasDupe = (matched: number[][], matches: string[][], userList: Map<string, number>): boolean => {
  for (const [personA, personB] of matches) {
    if (matched[userList.get(personA)!][userList.get(personB)!] > 1) return true;
  }
  return false;
};

/*
 * Gets the largest duplicate count among the matches given
 */
const getMaxDupe = (matched: number[][], matches: string[][], userList: Map<string, number>): number => {
  let maxDupe = 0;
  for (const [personA, personB] of matches) {
    maxDupe = Math.max(maxDupe, matched[userList.get(personA)!][userList.get(personB)!]);
  }
  return maxDupe;
};

/*
 * Loads historic matches into the tally, mapping ID's to numbers based on the mapping given
 * Since the ID's are normalized, we can return a 2D array of the tallies
 */
const loadMatched = async (notMatched: Map<string, number>): Promise<number[][]> => {
  const db = await openDB();
  const matched: number[][] = Array.from(Array(notMatched.size), () => new Array(4).fill(0));
  const matches = (await db.all(`SELECT * FROM coffee_historic_matches`)) as historic_match[];
  for (const { first_user_id, second_user_id } of matches) {
    if (notMatched.has(first_user_id) && notMatched.has(second_user_id)) {
      matched[notMatched.get(first_user_id)!][notMatched.get(second_user_id)!]++;
      matched[notMatched.get(second_user_id)!][notMatched.get(first_user_id)!]++;
    }
  }
  return matched;
};

/*
 * Writes a new round of matches into HISTORY
 * Use writeFutureMatches to save potential matches into future
 */
export const writeHistoricMatches = async (newMatches: string[][]): Promise<void> => {
  const db = await openDB();

  //uses sqlite's builtin CURRENT_TIMESTAMP to get the current standard time
  await db.run(
    `INSERT INTO coffee_historic_matches (first_user_id, second_user_id, date) VALUES ${_.join(
      newMatches.map((entry) => `('${entry[0]}', '${entry[1]}', CURRENT_TIMESTAMP)`),
      ','
    )};`
  );
};

/*
 * Wipes a database
 */
const wipeHistory = async (dbName: string): Promise<void> => {
  const db = await openDB();
  await db.run(`DELETE FROM ${dbName}`);
};

/*
 * matching algorithm leveraging stable marriage
 * takes in the users and their historical match data
 * Returns a round of match results based on this algorithm:
 * 1. Separate users randomly into 2 even sections, removing 1 user if list size is odd
 * 2. build a preference list for each user, sorted by how little they have chatted with each user
 * in the other section (fewest chatted user comes first, then second, etc)
 * 3. Run the stable marriage library with the 2 sections and their preferences
 * 4. Test this output to a finalOutput; If contender has a lower MaxDupe than the final, overwrite final
 * 5. Run 1-4 RANDOM_ITERATIONS times; every time an overwrite occurs, restart the iteration count
 * Return finalOutput
 */
const stableMatch = (userList: Map<string, number>, matched: number[][]): string[][] => {
  let finalOutput: string[][] | undefined = undefined;
  for (let i = 0; i < RANDOM_ITERATIONS; i++) {
    //shuffle users, then separate into 2 sections
    const notMatched = _.shuffle(Array.from(userList).map((name) => name[0]));
    const A = notMatched.slice(0, Math.floor(notMatched.length / 2)).map((name) => new Person(name));
    const B = notMatched.slice(Math.floor(notMatched.length / 2)).map((name) => new Person(name));

    //attach preference list for each user by creating comparator which prioritizes user with less chats than the subject
    A.forEach((value) =>
      value.generatePreferences(
        [...B].sort(
          (a, b) =>
            matched[userList.get(value.name)!][userList.get(a.name)!] -
            matched[userList.get(value.name)!][userList.get(b.name)!]
        )
      )
    );
    B.forEach((value) =>
      value.generatePreferences(
        [...A].sort(
          (a, b) =>
            matched[userList.get(value.name)!][userList.get(a.name)!] -
            matched[userList.get(value.name)!][userList.get(b.name)!]
        )
      )
    );

    //run stable marriage library and add to contender output
    stableMarriage(A);
    const output: string[][] = [];
    for (const person of A) {
      output.push([person.name, person.fiance.name]);
    }
    //compare with finaloutput's max Dupe count, overwrite is contender's is lower
    if (!finalOutput || getMaxDupe(matched, finalOutput, userList) > getMaxDupe(matched, output, userList)) {
      i = 0;
      finalOutput = output;
    }
  }
  //finalOutput will never be undefined; it will at least be the first output discovered
  return finalOutput!;
};

/*
 * Matching algo (not really an algo) leveraging random matches
 * Returns a round of match results
 * Optimizes by MaxDupe for RANDOM_ITERATION number of times; counter refreshed on valid optimization
 */
const randomMatch = (userList: Map<string, number>, matched: number[][]): string[][] => {
  let finalOutput: string[][] | undefined = undefined;
  for (let i = 0; i < RANDOM_ITERATIONS; i++) {
    //random shuffle of users, then match by adjacent pairs
    const notMatched = _.shuffle(Array.from(userList).map((name) => name[0]));
    const output: string[][] = [];
    for (let i = 0; i < notMatched.length; i += 2) {
      output.push([notMatched[i], notMatched[i + 1]]);
    }
    if (!finalOutput || getMaxDupe(matched, finalOutput, userList) > getMaxDupe(matched, output, userList)) {
      i = 0;
      finalOutput = output;
    }
  }

  return finalOutput!;
};

/*
 * Runs and compares performance of various matching algos
 * Takes in the size of a fake userList
 * Runs each algo until a dupe is found
 * Returns string - number mapping of a algo name and how many rounds it found before dupe
 */
export const testPerformance = async (testSize: number): Promise<Map<string, number>> => {
  const output: Map<string, number> = new Map();

  //creates dummy user ID's of 0-testSize
  const userList: Map<string, number> = new Map();
  Array.from(Array(testSize).keys()).forEach((value: number) => {
    userList.set(`${value}`, value);
  });
  //create empty match tally
  let matched: number[][] = new Array(testSize).fill(0).map(() => new Array(testSize).fill(0));
  let tally = 0;
  while (true) {
    tally += 1;
    //run an algo, udpate match tallies, then see if a dupe was created
    const matches = stableMatch(userList, matched);
    for (const pair of matches) {
      matched[userList.get(pair[0])!][userList.get(pair[1])!]++;
      matched[userList.get(pair[1])!][userList.get(pair[0])!]++;
    }
    if (hasDupe(matched, matches, userList)) break;
  }
  //save performance test to output
  output.set('STABLE', tally);

  //resets all values and repeats the above process for another algo
  matched = new Array(testSize).fill(0).map(() => new Array(testSize).fill(0));
  tally = 0;
  while (true) {
    tally += 1;
    const matches = randomMatch(userList, matched);
    for (const pair of matches) {
      matched[userList.get(pair[0])!][userList.get(pair[1])!]++;
      matched[userList.get(pair[1])!][userList.get(pair[0])!]++;
    }
    if (hasDupe(matched, matches, userList)) break;
  }
  output.set('RANDOM', tally);
  return output;
};

/*setting random iteration count to 1000 allows stable marriage to find the optimized matching for most cases, despite
 *the random aspect of this approach.
 *may want to consider a more efficient algorithm that doesn't need so many iterations in the future
 *consider implementing stable roommates (stable marriage generalization that doesn't require 2 sections)
 *https://en.wikipedia.org/wiki/Stable_roommates_problem
 *
 *Regardless, ensure that all matching algos have method signature
 * (userList: Map<string, number>, matched: number[][]): string[][]
 * For easy swapping and testing with the testPerformance handler
 */
