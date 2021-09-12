import { Client } from 'discord.js-commando';
import { Database } from 'sqlite';
import { openDB } from './db';
import _ from 'lodash';
import { Person, stableMarriage } from 'stable-marriage';

const COFFEE_EMOJI_ID: string = process.env.COFFEE_EMOJI_ID || '.';
const TARGET_GUILD_ID: string = process.env.TARGET_GUILD_ID || '.';
const RANDOM_ITERATIONS = 10;

interface match {
  first_user_id: string;
  second_user_id: string;
}

export const initCoffeechatTables = async (db: Database): Promise<void> => {
  await db.run(
    `
        CREATE TABLE IF NOT EXISTS coffee_pairings (
            first_user_id TEXT NOT NULL,
            second_user_id TEXT NOT NULL
        )
        `
  );
};

export const loadNotMatched = async (client: Client): Promise<Map<string, number>> => {
  const userList = (await (await client.guilds.fetch(TARGET_GUILD_ID)).members.fetch())
    ?.filter((member) => member.roles.cache.has(COFFEE_EMOJI_ID))
    .map((member) => member.user.id);
  const notMatched: Map<string, number> = new Map();
  userList.forEach((val: string, index: number) => {
    notMatched.set(val, index);
  });
  return notMatched;
};

export const countDupes = async (matches: string[][], client: Client): Promise<number> => {
  const userList = await loadNotMatched(client);
  const matched = await loadMatched(userList);
  let tally = 0;
  for (const [personA, personB] of matches) {
    tally += matched[userList.get(personA)!][userList.get(personB)!];
  }
  return tally;
};

export const hasDupe = async (matches: string[][], userList: Map<string, number>): Promise<boolean> => {
  const matched = await loadMatched(userList);
  for (const [personA, personB] of matches) {
    if (matched[userList.get(personA)!][userList.get(personB)!] > 1) return true;
  }
  return false;
};

export const getMaxDupe = async (matches: string[][], userList: Map<string, number>): Promise<number> => {
  const matched = await loadMatched(userList);
  let maxDupe = 0;
  for (const [personA, personB] of matches) {
    maxDupe = Math.max(maxDupe, matched[userList.get(personA)!][userList.get(personB)!]);
  }
  return maxDupe;
};

export const loadMatched = async (notMatched: Map<string, number>): Promise<number[][]> => {
  const db = await openDB();
  const matched: number[][] = new Array(notMatched.size).fill(0).map(() => new Array(notMatched.size).fill(0));
  const matches = (await db.all('SELECT * FROM coffee_pairings')) as match[];
  for (const { first_user_id, second_user_id } of matches) {
    if (notMatched.has(first_user_id) && notMatched.has(second_user_id)) {
      matched[notMatched.get(first_user_id)!][notMatched.get(second_user_id)!]++;
      matched[notMatched.get(second_user_id)!][notMatched.get(first_user_id)!]++;
    }
  }
  return matched;
};

export const writeNewMatches = async (newMatches: string[][]): Promise<void> => {
  const db = await openDB();
  await db.run(
    `INSERT INTO coffee_pairings (first_user_id, second_user_id) VALUES ${_.join(
      newMatches.map((entry) => `('${entry[0]}', '${entry[1]}')`),
      ','
    )};`
  );
};

export const wipeHistory = async (): Promise<void> => {
  const db = await openDB();
  await db.run(`DELETE FROM coffee_pairings`);
};

export const determineTolerance = (matched: number[][]): number => {
  let sum = 0;
  for (let i = 0; i < matched.length; i++) {
    for (let j = 0; j < i; j++) {
      sum += matched[i][j];
    }
  }
  console.log(sum);
  sum = Math.round(sum / ((matched.length * (matched.length - 1)) / 2));
  return sum;
};

export const stableMatch = async (userList: Map<string, number>, matched: number[][]): Promise<string[][]> => {
  let finalOutput: string[][] | undefined = undefined;
  for (let i = 0; i < RANDOM_ITERATIONS; i++) {
    const notMatched = _.shuffle(Array.from(userList).map((name) => name[0]));
    if (notMatched.length % 2 !== 0) {
      const single = notMatched.shift();
      console.log();
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
    if (!finalOutput || getMaxDupe(finalOutput, userList) > getMaxDupe(output, userList)) {
      console.log('optimized stable');
      finalOutput = output;
    }
  }
  return finalOutput!;
};

export const randomMatch = async (userList: Map<string, number>): Promise<string[][]> => {
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
    if (!finalOutput || getMaxDupe(finalOutput, userList) > getMaxDupe(output, userList)) {
      console.log('optimized random');
      finalOutput = output;
    }
  }

  return finalOutput!;
};
