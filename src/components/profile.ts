import _ from 'lodash'
import { openDB } from './db'
export interface UserProfile
{
  about_me?: string;
  birth_date?: string;
  preferred_name?: string;
  preferred_pronouns?: string;
  term?: string;
  year?: number;
  major?: string;
  program?: string;
}

export const getUserProfileById = async (userId: string): Promise<UserProfile | undefined > =>
{
  const db = await openDB();
  return await db.get('SELECT * FROM user_profile_table WHERE user_id = ?', userId);
};

export const editUserProfileById = async (userId: string, data: UserProfile
): Promise<void> =>
{
  const db = await openDB();
  const res = await db.run(`SELECT COUNT(*) as found FROM user_profile_table where user_id = ?`, userId)
  const user = _.get(res, 'found') == 1;
  let query;
  if (user){
    query = `UPDATE user_profile_table
              SET about_me=IFNULL(?, about_me), birth_date=IFNULL(?, birth_date), preferred_name=IFNULL(?, preferred_name), 
              preferred_name=IFNULL(?, preferred_name), preferred_pronouns=IFNULL(?, preferred_pronouns), 
              term=IFNULL(?, term), year=IFNULL(?, year), last_updated=IFNULL(?, last_updated), major=IFNULL(?, major),
              program=IFNULL(?, program), last_updated=CURRENT_TIMESTAMP
              WHERE user_id = ?
            `
  } else {
    query = `
            INSERT INTO user_profile_table 
            (user_id, about_me, birth_date, preferred_name, preferred_pronouns, term, year, last_updated, major, program) 
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
            `
  }
  await db.run(query, data.about_me, data.birth_date, data.preferred_name, 
    data.preferred_pronouns, data.term, data.year, data.major, data.program, userId)
}

