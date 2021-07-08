import { User } from 'discord.js';
import { Client } from 'discord.js-commando';
import { Database } from 'sqlite';
import { openDB } from './db';
import dotenv from 'dotenv';
dotenv.config();

const COFFEE_EMOJI_ID: string = process.env.COFFEE_EMOJI_ID || '.';
const TARGET_GUILD_ID: string = process.env.TARGET_GUILD_ID || '.';
let UserList: User[] | undefined = [];
let pastMatches: { [key: string]: string[] } = {};

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

export const loadUsers = async (client: Client): Promise<void> => {
  UserList = [];
  pastMatches = {};
  console.log(TARGET_GUILD_ID);
  console.log(COFFEE_EMOJI_ID);
  console.log(await (await client.guilds.fetch(TARGET_GUILD_ID)).members.fetch);
  (await (await client.guilds.fetch(TARGET_GUILD_ID)).members.fetch())?.forEach((member) => {
    if (member.roles.cache.has(COFFEE_EMOJI_ID)) {
      console.log(member.user);
      UserList?.push(member.user);
      pastMatches[member.user.id] = [];
    }
  });
};

export const loadPastMatches = async (client: Client): Promise<void> => {
  const db = await openDB();
  const matches = (await db.all('SELECT * FROM coffee_pairings')) as match[];
  for (const { first_user_id, second_user_id } of matches) {
    if (first_user_id in pastMatches) {
      pastMatches[first_user_id].push(second_user_id);
    }
    if (second_user_id in pastMatches) {
      pastMatches[second_user_id].push(first_user_id);
    }
  }
};
