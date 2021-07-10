import { User } from 'discord.js';
import { Client } from 'discord.js-commando';
import { Database } from 'sqlite';
import { openDB } from './db';
import _ from 'lodash';

const COFFEE_EMOJI_ID: string = process.env.COFFEE_EMOJI_ID || '.';
const TARGET_GUILD_ID: string = process.env.TARGET_GUILD_ID || '.';

interface match {
  first_user_id: string;
  second_user_id: string;
}

export const initCoffeechatTables = async (db: Database): Promise<void> => {
  await db.run(
    `
        CREATE TABLE IF NOT EXISTS coffee_pairings (
            first_user_id INTEGER NOT NULL,
            second_user_id INTEGER NOT NULL
        )
        `
  );
};

export const alertMatch = async (personA: User, personB: User): Promise<void> => {
  await personA.send(`Your match is <@${personB.id}>`);
  await personB.send(`Your match is <@${personA.id}>`);
};

export const loadNotMatched = async (client: Client): Promise<string[]> => {
  const notMatched = (await (await client.guilds.fetch(TARGET_GUILD_ID)).members.fetch())
    ?.filter((member) => member.roles.cache.has(COFFEE_EMOJI_ID))
    .map((member) => member.user.id);
  return notMatched;
};

export const loadMatched = async (notMatched: string[]): Promise<Map<string, string[]>> => {
  const db = await openDB();
  const matched: Map<string, string[]> = new Map();
  notMatched.forEach((id) => matched.set(id, []));
  const matches = (await db.all('SELECT * FROM coffee_pairings')) as match[];
  for (const { first_user_id, second_user_id } of matches) {
    if (first_user_id in matched) {
      matched.get(first_user_id)?.push(second_user_id);
    }
    if (second_user_id in matched) {
      matched.get(second_user_id)?.push(first_user_id);
    }
  }
  return matched;
};

export const writeNewMatches = async (newMatches: string[][]): Promise<void> => {
  const db = await openDB();
  await db.run(
    `INSERT INTO coffee_pairings (first_user_id, second_user_id) VALUES ${_.join(
      newMatches.map((entry) => `('${entry[0]}', '${entry[1]}')`)
    )};`
  );
};

export const genMatches = async (client: Client): Promise<string[][] | undefined> => {
  const notMatched = await loadNotMatched(client);
  const matched = await loadMatched(notMatched);
  const newMatches: Map<string, string> = new Map();
  // Iterate through every person
  while (notMatched.length >= 2) {
    const person = notMatched.pop();
    if (!person) continue; // for purposes of non-null asserting
    // Random their matches with the length of the array.
    const matchIndex = notMatched?.length > 1 ? Math.floor(Math.random() * notMatched?.length) : 0;

    // Check for already-matched.
    if (matched.get(person)?.includes(notMatched[matchIndex])) {
      // Check if we still have other unmatched pairings, if we do, we just keep
      // going. We will retry another pair and fix when people cannot be
      // matched from unmatched.
      if (notMatched.length === 0) {
        let newIndex = Math.floor(Math.random() * newMatches.size);
        let newPerson = Array.from(newMatches)[newIndex][0];
        while (matched.get(person)?.includes(newPerson)) {
          newIndex = Math.floor(Math.random() * newMatches.size);
          newPerson = Array.from(newMatches)[newIndex][0];
        }

        // Remove that person's match, add them to unmatched and continue.
        newMatches.set(person, newPerson);
        const newPersonMatch = newMatches.get(newPerson);
        if (newPersonMatch) {
          notMatched.push(newPersonMatch);
        }
        newMatches.delete(newPerson);
      } else {
        // Add them back in.
        notMatched.push(person);
      }
    } else {
      // Remove the matched person and add to matches.
      newMatches.set(person, notMatched[matchIndex]);
      notMatched.splice(matchIndex);
    } // If there is an odd number of people.
    if (notMatched.length !== 0) {
      console.log(`${notMatched[0]} is single and ready to mingle.`);
    }
    const newMatchArr: string[][] = [];
    for (const entry of newMatches[Symbol.iterator]()) {
      newMatchArr.push(entry);
    }
    writeNewMatches(newMatchArr);
    return newMatchArr;
  }
};
