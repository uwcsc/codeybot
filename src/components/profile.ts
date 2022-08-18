import { openDB } from './db';
import { ColorResolvable, Message } from 'discord.js';
import { getUserFromMessage } from '../codeyCommand';

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
  last_updated?: string;
}

const validFaculties = ['Mathematics', 'Engineering', 'Arts', 'Health', 'Science'];
const validTerms: string[] = [
  '1A',
  '1B',
  '2A',
  '2B',
  '3A',
  '3B',
  '4A',
  '4B',
  'MASc',
  'PhD',
  'Alumni',
  'Professor',
];
const yearStart = 1900;
const currentYear = new Date().getFullYear();
// the last valid year of graduation in the future. while most people graduate in <5 years, +2 years just to be safe
const yearEnd = currentYear + 7;
// range of years that can be assigned as a role.
enum validRoleYears {
  validRoleYearStart = currentYear - 2,
  validRoleYearEnd = yearEnd
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
  specialization = 'specialization',
}

export enum prettyProfileDetails {
  about_me = 'About Me',
  birth_date = 'Birth Date',
  preferred_name = 'Preferred Name',
  preferred_pronouns = 'Preferred Pronouns',
  term = 'Term',
  year = 'Year',
  faculty = 'Faculty',
  program = 'Program',
  specialization = 'Specialization',
  last_updated = 'Last Updated',
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
  'December',
];

export const customizationLimits = {
  aboutme:
    'Feel free to enter anything you want about yourself! Your hobbies, interests, etc. Must be less than 1000 characters.',
  birthdate:
    'To protect your personal information, this must only be your month of birth. Must be one of ' +
    validBirthdates.join(', '),
  preferred_name: 'Your preferred name.',
  preferred_pronouns: 'Your preferred pronouns.',
  term: 'Your school term. Must be one of ' + validTerms.join(', '),
  year: `The year you will graduate. Must be between ${yearStart} and ${yearEnd}`,
  faculty: 'Your faculty. Must be one of ' + validFaculties.join(', '),
  program: 'Your program.',
  specialization: 'Your specialization.',
};

interface userCustomization {
  reason: string;
  parsedDescription?: string;
}

enum validatedFields {
  birthdate = 'birthdate',
  term = 'term',
  faculty = 'faculty',
  year = 'year',
}

export const validCustomizations = Object.keys(configMaps) as Array<keyof typeof configMaps>;

export const validCustomizationsDisplay = `${validCustomizations.map((key) => ' ' + key)}`;

// validUserCustomization checks the customization description to ensure it is proper
// and also returns a formatted version of their description (proper capitalization)
export const validUserCustomization = (
  customization: keyof typeof configMaps,
  description: string,
): userCustomization => {
  let parsedDescription = description;
  if (customization !== validatedFields.term) {
    // convert first letter to capital in case the user doesnt use proper capitalization
    parsedDescription = description.toLowerCase();
    parsedDescription = parsedDescription[0].toUpperCase() + parsedDescription.slice(1);
  }
  switch (customization) {
    case validatedFields.birthdate:
      if (!validBirthdates.includes(parsedDescription)) {
        return {
          reason: 'Invalid birthdate. Must be one of : ' + validBirthdates.join(', ') + '.',
        };
      }
      break;
    case validatedFields.term:
      parsedDescription = description.toUpperCase();
      if (parsedDescription === 'MASC') {
        parsedDescription = 'MASc';
      } else if (parsedDescription === 'PHD') {
        parsedDescription = 'PhD';
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
      if (parseInt(parsedDescription) < yearStart || parseInt(parsedDescription) > yearEnd) {
        return { reason: 'Invalid year. Must be between: ' + yearStart + ' and ' + yearEnd + '.' };
      }
      break;
    default:
      parsedDescription = description;
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
export const editUserProfileById = async (userId: string, data: UserProfile, message: Message): Promise<void> => {
  // grab oldYear as that might be used later on when updating year roles
  const oldProfileDetails: UserProfile | undefined = await getUserProfileById(userId);
  const oldYear = oldProfileDetails?.year || null;

  const db = await openDB();
  // check if a user exists in the user_profile_table already
  const res = await db.get(
    `SELECT COUNT(*) as found FROM user_profile_table where user_id = ?`,
    userId,
  );
  const user = res;
  let query;
  let onlyCustomization; // declare on outerscope, we need to see if this is the year customization
  let onlyDescription;

  if (user.found === 1) {
    for (const [customization, description] of Object.entries(data)) {
      // grab the only customization and its corresponding description
      onlyCustomization = customization;
      onlyDescription = description;
    }
    // escape any instances of ' character by placing another ' in front of it by sqlite specifications
    onlyDescription.replace(/'/g, "''");
    query = `UPDATE user_profile_table SET last_updated=CURRENT_DATE, ${onlyCustomization}=? WHERE user_id=?`;
    await db.run(query, onlyDescription, userId);
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
    const description = Object.values(data)[0];
    // escape any instances of ' character by placing another ' in front of it by sqlite specifications
    description.replace(/'/g, "''");
    await db.run(query, userId, description);
  }
  // if database manages to update, and customization is year change year roles roles as well
  if (onlyCustomization && onlyCustomization === 'year') {
    // onlyDescription here would be the new year role
    updateProfileRoles(message, oldYear, onlyDescription);
  }
};

const addOrRemove = {
  add: true,
  remove: false
};

const updateRoleByRoleName = async (message: Message, roleName: string, add: boolean): Promise<void> => {
  const member = message.member;
  const userId = getUserFromMessage(message).id;
  const role = await message.guild?.roles.cache.find((role) => role?.name === roleName);
  if (!role) {
    console.log(`Could not find the role ${roleName}`);
    return;
  }
  try {
    // log success and failure if need to debug
    if (add) {
      await member?.roles.add(role);
      console.log(`Added the year role ${roleName} to user ${userId}`);
    } else {
      await member?.roles.remove(role);
      console.log(`Removed the year role ${roleName} to user ${userId}`);
    }
  } catch (err) {
    console.log(`Failed to ${add ? 'add' : 'remove'} to user ${userId}`);
  }
  return;
};

export const updateProfileRoles = async (message: Message, oldYear: number | null, gradYear: number): Promise<void> => {
  if (gradYear < currentYear) {
    // assign alumni role to the user
    updateRoleByRoleName(message, 'Alumni', addOrRemove.add);
  } else {
    // remove alumni role to the user if they for some reason have the alumni role and are not graduated
    updateRoleByRoleName(message, 'Alumni', addOrRemove.remove);
  }

  if (gradYear >= validRoleYears.validRoleYearStart && gradYear <= validRoleYears.validRoleYearEnd) {
    // check if role for that year exists, if not add it
    const newYearRoleName = gradYear.toString();
    let findRole = message.guild?.roles.cache.find((role) => role?.name === newYearRoleName);

    if (!findRole) {
      try {
        // create role object
        const newRole = {
          name: newYearRoleName,
          color: 'GREY' as ColorResolvable,
          reason: `AUTOMATED: Creating new year role for ${newYearRoleName}`
        };
        await message.guild?.roles.create(newRole);
        findRole = await message.guild?.roles.cache.find((role) => role?.name === newYearRoleName);
        console.log(`CREATED YEAR ROLE FOR ${newYearRoleName}`);
      } catch (err) {
        console.log(`FAILED TO CREATE YEAR ROLE FOR ${newYearRoleName}: REASON: ${err}`);
      }
    }
    // assign that role to the user
    updateRoleByRoleName(message, newYearRoleName, addOrRemove.add);
    // final step: remove their existing year role
    if (oldYear && newYearRoleName !== oldYear.toString()) {
      updateRoleByRoleName(message, oldYear.toString(), addOrRemove.remove);
    }
  }

  return;
};
