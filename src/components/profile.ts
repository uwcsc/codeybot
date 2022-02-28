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
const yearStart = 1900;
const yearEnd = 2050;
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
  'February',
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

enum validatedFields {
  birthdate = 'birthdate',
  term = 'term',
  faculty = 'faculty',
  year = 'year'
}

export const validUserCustomization = (
  customization: keyof typeof configMaps,
  description: string
): userCustomization => {
  if (!(Object.keys(configMaps) as Array<keyof typeof configMaps>).includes(customization)) {
    return {
      reason: `Invalid customization selection. Must be one of **${(Object.keys(configMaps) as Array<
        keyof typeof configMaps
      >).map((key) => ' ' + key)}**`
    };
  }
  let parsedDescription = description;
  if (customization !== validatedFields.term) {
    // convert first letter to capital in case the user doesnt use proper capitalization
    parsedDescription = description.toLowerCase();
    parsedDescription = parsedDescription[0].toUpperCase() + parsedDescription.slice(1);
  }
  switch (customization) {
    case validatedFields.birthdate:
      if (!validBirthdates.includes(parsedDescription)) {
        return { reason: 'Invalid birthdate. Must be one of : ' + validBirthdates.join(', ') + '.' };
      }
      break;
    case validatedFields.term:
      // MASc is the only term that is not full upper case
      if (description.toLowerCase() === 'masc') {
        parsedDescription = 'MASc';
      } else {
        parsedDescription = description.toUpperCase();
      }
      if (!validTerms.includes(parsedDescription)) {
        return { reason: 'Invalid term. Must be one of : ' + validTerms.join(', ') + '.' };
      }
      break;
    case validatedFields.faculty:
      if (!validFaculties.includes(parsedDescription)) {
        return { reason: 'Invalid faculty. Must be one of : ' + validFaculties.join(', ') + '.' };
      }
      break;
    case validatedFields.year:
      if (!validYears.includes(parseInt(description))) {
        return { reason: 'Invalid year. Must be between of : ' + validYears.join(', ') + '.' };
      }
      break;
  }
  return { reason: 'valid', parsedDescription };
};

export const getUserProfileById = async (userId: string): Promise<UserProfile | undefined> => {
  const db = await openDB();
  return await db.get('SELECT * FROM user_profile_table WHERE user_id = ?', userId);
};

// NOTE: data will always be just one customization, but we do not know which one, meaning many of
// the loops are just to extract an unknown key-val pair
export const editUserProfileById = async (userId: string, data: UserProfile): Promise<void> => {
  const db = await openDB();
  // check if a user exists in the user_profile_table already
  const res = await db.get(`SELECT COUNT(*) as found FROM user_profile_table where user_id = ?`, userId);
  const user = res.found == 1;
  let query;
  if (user) {
    query = `UPDATE user_profile_table SET last_updated=CURRENT_DATE, `;
    for (const [customization, description] of Object.entries(data)) {
      // will set that one extra field equal to the description provided
      query = query.concat(`${customization}='${description}'`);
    }
    query = query.concat('WHERE user_id = ?');
    await db.run(query, userId);
  } else {
    query = `
            INSERT INTO user_profile_table 
            (user_id, last_updated,
            `;
    // add on the one data value that will be set
    for (const customization of Object.keys(data)) {
      query = query.concat(`${customization})`);
    }
    query = query.concat(`VALUES (?, CURRENT_DATE, ?)`);
    // there is only one element in object.values (which is the description)
    await db.run(query, userId, Object.values(data)[0]);
  }
};
