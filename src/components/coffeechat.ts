import { Client } from 'discord.js-commando';
import { Database } from 'sqlite';
import { openDB } from './db';
import _ from 'lodash';
import { Person, stableMarriage } from 'stable-marriage';

const COFFEE_EMOJI_ID: string = process.env.COFFEE_EMOJI_ID || '.';
const TARGET_GUILD_ID: string = process.env.TARGET_GUILD_ID || '.';
const RANDOM_ITERATIONS = 1000;

interface historic_match {
  first_user_id: string;
  second_user_id: string;
  date: string;
}

interface future_match {
  first_user_id: string;
  second_user_id: string;
  week_id: number;
}

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
  await db.run(
    `
        CREATE TABLE IF NOT EXISTS coffee_historic_matches (
            first_user_id TEXT NOT NULL,
            second_user_id TEXT NOT NULL,
            date TEXT NOT NULL
        )
        `
  );
  await db.run(
    `
        CREATE TABLE IF NOT EXISTS coffee_future_matches (
            first_user_id TEXT NOT NULL,
            second_user_id TEXT NOT NULL,
            week_id INTEGER NOT NULL
        )
        `
  );
  await db.run(
    `
        CREATE TABLE IF NOT EXISTS coffee_week_status (
            week_id INTEGER PRIMARY KEY,
            finished BOOL NOT NULL
        )
        `
  );
};

export const generateFutureMatches = async (client: Client, size = 10): Promise<number> => {
  //reset tables
  wipeHistory('coffee_future_matches');
  wipeHistory('coffee_week_status');
  const userList = await loadNotMatched(client);
  const matched = await loadMatched(userList);
  for (let i = 0; i < size; i++) {
    const nextResults = stableMatch(userList, matched);
    writeFutureMatches(nextResults, i);
    for (const pair of nextResults) {
      matched[userList.get(pair[0])!][userList.get(pair[1])!]++;
      matched[userList.get(pair[1])!][userList.get(pair[0])!]++;
    }
  }
  return size;
};

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
  const activeMatchIDs = [...(await loadNotMatched(client)).keys()];
  const generatedMatchIDs = await getFutureMatchIDs();

  //test if generated matches still work for people wanting a match
  if (activeMatchIDs.length != generatedMatchIDs.length) return false;
  for (const key of activeMatchIDs) {
    if (!generatedMatchIDs.includes(key)) return false;
  }

  //test if there exists week_id that is not finished
  const test_id = await db.get(`SELECT * FROM coffee_week_status WHERE finished = 0`);
  console.log(test_id);
  if (!test_id) return false;

  return true;
};

//returns the single person in single, if they exist
export const getNextFutureMatch = async (client: Client): Promise<{ matches: string[][]; single: string | null }> => {
  const db = await openDB();
  const { week_id } = (await db.get(
    `SELECT week_id FROM coffee_week_status WHERE finished = 0 ORDER BY week_id ASC LIMIT 1;`
  )) as { week_id: number };

  const matches = ((await db.all(
    `SELECT * FROM coffee_future_matches WHERE week_id = ${week_id};`
  )) as future_match[]).map((entry) => [entry.first_user_id, entry.second_user_id]);
  await db.run(`UPDATE coffee_week_status SET finished = 1 WHERE week_id = ${week_id};`);
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

const loadNotMatched = async (client: Client): Promise<Map<string, number>> => {
  const userList = (await (await client.guilds.fetch(TARGET_GUILD_ID)).members.fetch())
    ?.filter((member) => member.roles.cache.has(COFFEE_EMOJI_ID))
    .map((member) => member.user.id);
  const notMatched: Map<string, number> = new Map();
  userList.forEach((val: string, index: number) => {
    notMatched.set(val, index);
  });
  return notMatched;
};

const hasDupe = (matched: number[][], matches: string[][], userList: Map<string, number>): boolean => {
  for (const [personA, personB] of matches) {
    if (matched[userList.get(personA)!][userList.get(personB)!] > 1) return true;
  }
  return false;
};

const getMaxDupe = (matched: number[][], matches: string[][], userList: Map<string, number>): number => {
  let maxDupe = 0;
  for (const [personA, personB] of matches) {
    maxDupe = Math.max(maxDupe, matched[userList.get(personA)!][userList.get(personB)!]);
  }
  return maxDupe;
};

const loadMatched = async (notMatched: Map<string, number>): Promise<number[][]> => {
  const db = await openDB();
  const matched: number[][] = new Array(notMatched.size).fill(0).map(() => new Array(notMatched.size).fill(0));
  const matches = (await db.all(`SELECT * FROM coffee_historic_matches`)) as historic_match[];
  for (const { first_user_id, second_user_id } of matches) {
    if (notMatched.has(first_user_id) && notMatched.has(second_user_id)) {
      matched[notMatched.get(first_user_id)!][notMatched.get(second_user_id)!]++;
      matched[notMatched.get(second_user_id)!][notMatched.get(first_user_id)!]++;
    }
  }
  return matched;
};

export const writeNewMatches = async (newMatches: string[][], date: Date): Promise<void> => {
  const db = await openDB();

  //leverages datetime() in sqlite to convert to some standard of sqlite time
  await db.run(
    `INSERT INTO coffee_historic_matches (first_user_id, second_user_id, date) VALUES ${_.join(
      newMatches.map((entry) => `('${entry[0]}', '${entry[1]}', datetime('${date.toISOString()}'))`),
      ','
    )};`
  );
};

const wipeHistory = async (dbName: string): Promise<void> => {
  const db = await openDB();
  await db.run(`DELETE FROM ${dbName}`);
};

const stableMatch = (userList: Map<string, number>, matched: number[][]): string[][] => {
  let finalOutput: string[][] | undefined = undefined;
  for (let i = 0; i < RANDOM_ITERATIONS; i++) {
    const notMatched = _.shuffle(Array.from(userList).map((name) => name[0]));
    if (notMatched.length % 2 !== 0) {
      const single = notMatched.shift();
    }
    const A = notMatched.slice(0, Math.floor(notMatched.length / 2)).map((name) => new Person(name));
    const B = notMatched.slice(Math.floor(notMatched.length / 2)).map((name) => new Person(name));
    A.forEach((value: any) =>
      value.generatePreferences(
        [...B].sort(
          (a, b) =>
            matched[userList.get(value.name)!][userList.get(a.name)!] -
            matched[userList.get(value.name)!][userList.get(b.name)!]
        )
      )
    );
    B.forEach((value: any) =>
      value.generatePreferences(
        [...A].sort(
          (a, b) =>
            matched[userList.get(value.name)!][userList.get(a.name)!] -
            matched[userList.get(value.name)!][userList.get(b.name)!]
        )
      )
    );
    stableMarriage(A);
    const output: string[][] = [];
    for (const person of A) {
      output.push([person.name, person.fiance.name]);
    }
    if (!finalOutput || getMaxDupe(matched, finalOutput, userList) > getMaxDupe(matched, output, userList)) {
      i = 0;
      finalOutput = output;
    }
  }
  return finalOutput!;
};

const randomMatch = (userList: Map<string, number>, matched: number[][]): string[][] => {
  let finalOutput: string[][] | undefined = undefined;
  for (let i = 0; i < 5; i++) {
    const notMatched = _.shuffle(Array.from(userList).map((name) => name[0]));
    if (notMatched.length % 2 !== 0) {
      const single = notMatched.shift();
      // console.log(`${single} is single and ready to mingle.`);
    }
    const output: string[][] = [];
    for (let i = 0; i < notMatched.length; i += 2) {
      output.push([notMatched[i], notMatched[i + 1]]);
    }
    if (!finalOutput || getMaxDupe(matched, finalOutput, userList) > getMaxDupe(matched, output, userList)) {
      finalOutput = output;
    }
  }

  return finalOutput!;
};

export const testPerformance = async (testSize: number): Promise<Map<string, number>> => {
  const output: Map<string, number> = new Map();
  const userList: Map<string, number> = new Map();
  Array.from(Array(testSize).keys()).forEach((value: number) => {
    userList.set(`${value}`, value);
  });
  let matched: number[][] = new Array(testSize).fill(0).map(() => new Array(testSize).fill(0));
  let tally = 0;
  while (true) {
    tally += 1;
    const matches = stableMatch(userList, matched);
    for (const pair of matches) {
      matched[userList.get(pair[0])!][userList.get(pair[1])!]++;
      matched[userList.get(pair[1])!][userList.get(pair[0])!]++;
    }
    if (hasDupe(matched, matches, userList)) break;
  }
  output.set('STABLE', tally);
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
