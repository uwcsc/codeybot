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

const validPrograms = []; // do we want validate these
const validTerms: string[] = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "MASc", "PHD"] ;
const validYears: number[] = [];
for (let i = 2021; i < 2030; i++){
  validYears.push(i)
}

export enum configMaps {
  aboutme = "about_me",
  birthdate = "birth_date",
  preferredname = "preferred_name",
  preferredpronouns = "preferred_pronouns",
  term = "term",
  year = "year",
  major = "major",
  program = "program"
}

const validBirthdates = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const customizationLimits = {
  aboutme: "Feel free to enter anything you want about yourself! Your hobbies, interests, etc. Must be less than 1000 characters.",
  birthdate: "To protect your personal information, this must be just your month. Valid arguments are " + validBirthdates.join(" "),
  term: "Must be one of " + validTerms.join(" "),
  year: "The year you will graduate.",
  major: "",
  program: "",
}

export const validUserCustomization = (customization: keyof typeof configMaps, description: string): string => {
  switch (customization) {
    case "birthdate":
      return "valid" // need to change this
    case "term":
      if (!validTerms.includes(description)){
        return "Invalid term. Must be one of : " + validTerms.join(", ") + "."
      }
    case "major":
      return "valid" // need to change this
    case "program":
      return "valid" // need to change this
    case "year":
      if (!validYears.includes(parseInt(description))){
        return "Invalid year. Must be one of : " + validYears.join(", ") + "."
      }
  }
  return "valid"
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
  const res = await db.get(`SELECT COUNT(*) as found FROM user_profile_table where user_id = ?`, userId)
  const user = res.found == 1;
  let query;
  if (user){
    query = `UPDATE user_profile_table
              SET about_me=IFNULL(?, about_me), birth_date=IFNULL(?, birth_date), preferred_name=IFNULL(?, preferred_name), 
              preferred_pronouns=IFNULL(?, preferred_pronouns), 
              term=IFNULL(?, term), year=IFNULL(?, year), major=IFNULL(?, major),
              program=IFNULL(?, program), last_updated=CURRENT_TIMESTAMP
              WHERE user_id = ?
            `
    await db.run(query, data.about_me, data.birth_date, data.preferred_name, 
    data.preferred_pronouns, data.term, data.year, data.major, data.program, userId)
  } else {
    query = `
            INSERT INTO user_profile_table 
            (user_id, about_me, birth_date, preferred_name, preferred_pronouns, term, year, last_updated, major, program) 
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
            `
    await db.run(query, userId, data.about_me, data.birth_date, data.preferred_name, 
    data.preferred_pronouns, data.term, data.year, data.major, data.program)
  }

}


