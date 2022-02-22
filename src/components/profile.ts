import _ from 'lodash';
import { openDB } from './db';

// since interfaces are for compile time there is no easy way to extract keys
// so this userProfileKeys is needed
export const userProfileKeys = [
  'about_me',
  'birth_date',
  'preferred_name',
  'preferred_pronouns',
  'term',
  'year',
  'faculty',
  'program',
  'specialization'
];

export interface UserProfile {
  about_me?: string;
  birth_date?: string;
  preferred_name?: string;
  preferred_pronouns?: string;
  term?: string;
  year?: number;
  faculty?: string;
  program?: string;
  specialization?: string;
}

const validFaculties = ['Mathematics', 'Engineering', 'Arts', 'Health', 'Science'];
const validTerms: string[] = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', 'MASc', 'PHD'];
const validYears: number[] = [];
const yearStart = 2000;
const yearEnd = 2030;
for (let i = yearStart; i <= yearEnd; i++) {
  validYears.push(i);
}

export enum configMaps {
  aboutme = 'about_me',
  birthdate = 'birth_date',
  preferredname = 'preferred_name',
  preferredpronouns = 'preferred_pronouns',
  term = 'term',
  year = 'year',
  faculty = 'faculty',
  program = 'program',
  specialization = 'specialization'
}

const validBirthdates = [
  'January',
  'Febuary',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const customizationLimits = {
  aboutme:
    'Feel free to enter anything you want about yourself! Your hobbies, interests, etc. Must be less than 1000 characters.',
  birthdate:
    'To protect your personal information, this must be just your month. Must be one of ' + validBirthdates.join(', '),
  preferred_name: 'Your preferred name.',
  preferred_pronouns: 'Your preferred pronouns.',
  term: 'Your school term. Must be one of ' + validTerms.join(', '),
  year: `The year you will graduate. Must be between ${yearStart} and ${yearEnd}`,
  faculty: 'Your faculty. Must be one of ' + validFaculties.join(', '),
  program: 'Your program.',
  specialization: 'Your specialization.'
};

interface userCustomization {
  reason: string;
  parsedDescription?: string;
}

export const validUserCustomization = (
  customization: keyof typeof configMaps,
  description: string
): userCustomization => {
  if (!(Object.keys(configMaps) as Array<keyof typeof configMaps>).includes(customization)) {
    return {
      reason: `Invalid customization selection. Must be one of **${(
        Object.keys(configMaps) as Array<keyof typeof configMaps>
      ).map((key) => ' ' + key)}**`
    };
  }
  let parsedDescription = description;
  switch (customization) {
    case 'birthdate':
      // convert first letter to capital in case the user doesnt use proper capitalization
      parsedDescription = description.toLowerCase();
      parsedDescription = parsedDescription[0].toUpperCase() + parsedDescription.slice(1);
      if (!validBirthdates.includes(parsedDescription)) {
        return { reason: 'Invalid birthdate. Must be one of : ' + validBirthdates.join(', ') + '.' };
      }
      break;
    case 'term':
      parsedDescription = description.length == 2 ? description.toUpperCase() : description;
      if (!validTerms.includes(parsedDescription)) {
        return { reason: 'Invalid term. Must be one of : ' + validTerms.join(', ') + '.' };
      }
      break;
    case 'faculty':
      // convert first letter to capital in case the user doesnt use proper capitalization
      parsedDescription = description.toLowerCase();
      parsedDescription = parsedDescription[0].toUpperCase() + parsedDescription.slice(1);
      if (!validFaculties.includes(parsedDescription)) {
        return { reason: 'Invalid faculty. Must be one of : ' + validFaculties.join(', ') + '.' };
      }
      break;
    case 'year':
      if (!validYears.includes(parseInt(description))) {
        return { reason: 'Invalid year. Must be between of : ' + validYears.join(', ') + '.' };
      }
      break;
    default:
      return { reason: 'Error! Cannot find customization. Please contact a CSC executive.' };
  }
  return { reason: 'valid', parsedDescription };
};

export const getUserProfileById = async (userId: string): Promise<UserProfile | undefined> => {
  const db = await openDB();
  return await db.get('SELECT * FROM user_profile_table WHERE user_id = ?', userId);
};

export const editUserProfileById = async (userId: string, data: UserProfile): Promise<void> => {
  const db = await openDB();
  const res = await db.get(`SELECT COUNT(*) as found FROM user_profile_table where user_id = ?`, userId);
  const user = res.found == 1;
  let query;
  if (user) {
    query = `UPDATE user_profile_table SET last_updated=CURRENT_TIMESTAMP, `;
    for (const [customization, description] of Object.entries(data)) {
      query = query.concat(`${customization}=IFNULL('${description}', ${customization}) `);
    }
    query = query.concat('WHERE user_id = ?');
    await db.run(query, userId);
  } else {
    query = `
            INSERT INTO user_profile_table 
            (user_id, last_updated,
            `;
    for (const customization of Object.keys(data)) {
      query = query.concat(`${customization})`);
    }
    query = query.concat(`VALUES (?, CURRENT_TIMESTAMP, ?)`);
    await db.run(query, userId, ...Object.values(data));
  }
};
