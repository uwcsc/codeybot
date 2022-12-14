import { container } from '@sapphire/framework';
import _ from 'lodash';
import { Person, stableMarriage } from 'stable-marriage';
import { vars } from '../config';
import { openDB } from './db';
import { loadRoleUsers } from '../utils/roles';
import { User } from 'discord.js';
import { sendMessage } from '../utils/dm';

const COFFEE_ROLE_ID: string = vars.COFFEE_ROLE_ID;
//since we might fully hit hundreds of people if we release this into the wider server, set iterations at around 100-200 to keep time at a reasonable number
//averages around 90% for test sizes 10-20, 75% for test sizes 100-200 people
const RANDOM_ITERATIONS = 100;

interface historic_match {
  first_user_id: string;
  second_user_id: string;
  match_date: string;
}

/*
 * Generates a single match round based on historical match records
 * Does NOT save this match to history; must call writeHistoricMatches to "confirm" this matching happened
 * Returns a potential single chatter in the single field, null otherwise
 */
export const getMatch = async (): Promise<string[][]> => {
  // Gets the list of users that are currently "enrolled" in role
  const userList = await loadRoleUsers(COFFEE_ROLE_ID);

  // Assigns each user ID a unique index
  const notMatched: Map<string, number> = new Map();

  // Returns a mapping of string -> int, where string is their ID, while int is an index assigned to the ID
  // The index is used in place of the ID for match tallying
  userList.forEach((val: User, index: number) => {
    notMatched.set(val.id, index);
  });

  const matched = await loadMatched(notMatched);
  //generate one week of matches, and updates match freq tables accordingly
  const matches = stableMatch(notMatched, matched);
  return matches;
};

/*
 * Checks if a match happened more than once in the tally
 */
const hasDupe = (
  matched: number[][],
  matches: string[][],
  userList: Map<string, number>,
): boolean => {
  for (const [personA, personB] of matches) {
    if (matched[userList.get(personA)!][userList.get(personB)!] > 1) return true;
  }
  return false;
};

/*
 * Gets the largest duplicate count among the matches given
 */
const getMaxDupe = (
  matched: number[][],
  matches: string[][],
  userList: Map<string, number>,
): number => {
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
  const matched: number[][] = Array.from(Array(notMatched.size), () =>
    new Array(notMatched.size).fill(0),
  );
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
 */
export const writeHistoricMatches = async (newMatches: string[][]): Promise<void> => {
  const db = await openDB();

  //insert (?,?,CURRENT_TIMESTAMP) into command based on number of rows, then populate params into second arg
  //uses sqlite's builtin CURRENT_TIMESTAMP to get the current standard time
  await db.run(
    `INSERT INTO coffee_historic_matches (first_user_id, second_user_id, match_date) VALUES ${_.join(
      newMatches.map(() => `(?,?, CURRENT_TIMESTAMP)`),
      ',',
    )};`,
    _.flatten(newMatches),
  );
};

/*
 * Matching algorithm leveraging stable marriage
 * Takes in the users and their historical match data
 * Returns a round of match results based on this algorithm:
 * 1. Separate users randomly into 2 even sections, duplicating 1 user if list size is odd
 * 2. Build a preference list for each user, sorted by how little they have chatted with each user
 * in the other section (fewest chatted user comes first, then second, etc.)
 * 3. Run the stable marriage library with the 2 sections and their preferences
 * 4. Test this output to a finalOutput; if contender has a lower maxDupe than the final, overwrite final
 * 5. Run 1-4 RANDOM_ITERATIONS times; every time an overwrite occurs, restart the iteration count
 * Return finalOutput
 */
const stableMatch = (userList: Map<string, number>, matched: number[][]): string[][] => {
  let finalOutput: string[][] | undefined = undefined;
  for (let i = 0; i < RANDOM_ITERATIONS; i++) {
    //shuffle users, then separate into 2 sections
    const notMatched = _.shuffle(Array.from(userList).map((name) => name[0]));
    const A = notMatched
      .slice(0, Math.floor(notMatched.length / 2))
      .map((name) => new Person(name));
    const B = notMatched.slice(Math.floor(notMatched.length / 2)).map((name) => new Person(name));
    //if there is an imbalance between the "genders", we have an odd amount of people. Duplicate someone on the short end to give somebody 2 matches
    //by math, A should always be the one that's short in odd numbers
    if (A.length < B.length) {
      A.push(new Person(notMatched[Math.floor(Math.random() * Math.floor(notMatched.length / 2))]));
    }
    //generates comparator attacher for both "genders" which prioritizes user that has less chats with the subject
    //stable marriage function is written in JS, no type declarations :/
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generateComparators = (left: any[], right: any[]) => {
      left.forEach((value) =>
        value.generatePreferences(
          [...right].sort(
            (a, b) =>
              matched[userList.get(value.name)!][userList.get(a.name)!] -
              matched[userList.get(value.name)!][userList.get(b.name)!],
          ),
        ),
      );
    };
    //attach preference list for each user with comparator
    generateComparators(A, B);
    generateComparators(B, A);

    //run stable marriage library and add to contender output
    stableMarriage(A);
    const output: string[][] = [];
    for (const person of A) {
      output.push([person.name, person.fiance.name]);
    }
    //compare with finalOutput's maxDupe count, overwrite if contender's is lower
    if (
      !finalOutput ||
      getMaxDupe(matched, finalOutput, userList) > getMaxDupe(matched, output, userList)
    ) {
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
 * Optimizes by maxDupe for RANDOM_ITERATION number of times; counter refreshed on valid optimization
 */
const randomMatch = (userList: Map<string, number>, matched: number[][]): string[][] => {
  let finalOutput: string[][] | undefined = undefined;
  for (let i = 0; i < RANDOM_ITERATIONS; i++) {
    //random shuffle of users, then match by adjacent pairs
    const notMatched = _.shuffle(Array.from(userList).map((name) => name[0]));
    const output: string[][] = [];
    for (let i = 0; i + 1 < notMatched.length; i += 2) {
      output.push([notMatched[i], notMatched[i + 1]]);
    }
    if (
      !finalOutput ||
      getMaxDupe(matched, finalOutput, userList) > getMaxDupe(matched, output, userList)
    ) {
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
    //run an algo, update match tallies, then see if a dupe was created
    const matches = stableMatch(userList, matched);
    for (const pair of matches) {
      matched[userList.get(pair[0])!][userList.get(pair[1])!]++;
      matched[userList.get(pair[1])!][userList.get(pair[0])!]++;
    }
    if (hasDupe(matched, matches, userList)) break;
    tally += 1;
  }
  //save performance test to output
  output.set('STABLE', tally);

  //resets all values and repeats the above process for another algo
  matched = new Array(testSize).fill(0).map(() => new Array(testSize).fill(0));
  tally = 0;
  while (true) {
    const matches = randomMatch(userList, matched);
    for (const pair of matches) {
      matched[userList.get(pair[0])!][userList.get(pair[1])!]++;
      matched[userList.get(pair[1])!][userList.get(pair[0])!]++;
    }
    if (hasDupe(matched, matches, userList)) break;
    tally += 1;
  }
  output.set('RANDOM', tally);
  return output;
};

export const alertMatches = async (matches: string[][]): Promise<void> => {
  const { client } = container;
  const outputMap: Map<string, string[]> = new Map();
  const userMap: Map<string, User> = new Map();
  //map them to find what to send a specific person
  for (const pair of matches) {
    if (!outputMap.get(pair[0])) {
      outputMap.set(pair[0], []);
      userMap.set(pair[0], await client.users.fetch(pair[0]));
    }
    if (!outputMap.get(pair[1])) {
      outputMap.set(pair[1], []);
      userMap.set(pair[1], await client.users.fetch(pair[1]));
    }
    outputMap.get(pair[0])!.push(pair[1]);
    outputMap.get(pair[1])!.push(pair[0]);
  }
  //send out messages
  outputMap.forEach(async (targets, user) => {
    const discordUser = userMap.get(user)!;
    //we use raw discord id ping format to minimize fetch numbers on our end
    const userTargets = targets.map((value) => userMap.get(value)!);

    let message: string;

    if (targets.length > 1) {
      message = `Your coffee chat :coffee: matches for this week are... **${userTargets[0].tag}** and **${userTargets[1].tag}**! Feel free to contact ${userTargets[0]} and ${userTargets[1]} at your earliest convenience. :wink: If you have any suggestions, please use the suggestion feature to give us feedback!`;
    } else {
      message = `Your coffee chat :coffee: match for this week is... **${userTargets[0].tag}**! Feel free to contact ${userTargets[0]} at your earliest convenience. :wink: If you have any suggestions, please use the .suggestion feature to give us feedback!`;
    }

    await sendMessage(discordUser, message);
  });
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
