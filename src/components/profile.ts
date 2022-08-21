import { openDB } from './db';
import { ColorResolvable, GuildMember, RoleManager } from 'discord.js';

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
  validRoleYearEnd = yearEnd,
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
export const editUserProfile = async (member: GuildMember, data: UserProfile): Promise<void> => {
  const db = await openDB();
  // check if a user exists in the user_profile_table already
  const res = await db.get(
    `SELECT COUNT(*) as found FROM user_profile_table where user_id = ?`,
    member.id,
  );
  const user = res;
  let query;

  // grab the only customization and its corresponding description
  const [customization, description] = Object.entries(data)[0];

  if (customization === 'year') {
    // description here would be the new year role
    await updateMemberGradRoles(member, description);
  }

  if (user.found === 1) {
    // if customization is year, change year roles as well
    // escape any instances of ' character by placing another ' in front of it by sqlite specifications
    description.replace(/'/g, "''");
    query = `UPDATE user_profile_table SET last_updated=CURRENT_DATE, ${customization}=? WHERE user_id=?`;
    await db.run(query, description, member.id);
  } else {
    query = `
            INSERT INTO user_profile_table
            (user_id, last_updated, ${customization}) 
            VALUES (?, CURRENT_DATE, ?)
            `;
    // escape any instances of ' character by placing another ' in front of it by sqlite specifications
    description.replace(/'/g, "''");
    await db.run(query, member.id, description);
  }
};

const addOrRemove = {
  add: true,
  remove: false,
};

const updateMemberRole = async (
  member: GuildMember,
  roleName: string,
  add: boolean,
): Promise<void> => {
  const userId = member.id;
  const role = member.guild?.roles.cache.find((role) => role?.name === roleName);
  if (!role) {
    throw new Error(`Could not find the role ${roleName}`);
  }
  try {
    if (add) {
      await member?.roles.add(role);
    } else {
      await member?.roles.remove(role);
    }
  } catch (err) {
    throw new Error(`Failed to ${add ? 'add to' : 'remove from'} user ${userId}`);
  }
};

const yearToDecade = (year: number) => {
  return year - (year % 10);
};

const createNewRole = async (roleName: string, roles: RoleManager): Promise<void> => {
  try {
    // create role object
    const newRole = {
      name: roleName,
      color: 'GREY' as ColorResolvable,
      reason: `AUTOMATED: Creating new role for ${roleName}`,
    };
    await roles.create(newRole);
  } catch (err) {
    throw new Error(`Failed to create new role for ${roleName}: ${err}`);
  }
};

const updateMemberGradRoles = async (member: GuildMember, gradYear: number): Promise<void> => {
  // no roles created if gradYear is < 1900 (impossible)
  if (gradYear < 1900) {
    return;
  }
  if (gradYear < currentYear) {
    // assign alumni role to the user
    updateMemberRole(member, 'Alumni', addOrRemove.add);
  } else {
    // remove alumni role to the user if they for some reason have the alumni role and are not graduated
    updateMemberRole(member, 'Alumni', addOrRemove.remove);
  }
  let newYearRoleName: string;
  if (gradYear >= validRoleYears.validRoleYearStart) {
    newYearRoleName = gradYear.toString();
    // check if role for that year exists, if not add it
    const findRole = member.guild?.roles.cache.find((role) => role?.name === newYearRoleName);

    if (!findRole && member.guild?.roles) {
      await createNewRole(newYearRoleName, member.guild.roles);
    }
    // assign that role to the user
    updateMemberRole(member, newYearRoleName, addOrRemove.add);
  } else {
    // otherwise, decade role. e.g: 1980s, 1990s, etc.
    newYearRoleName = yearToDecade(gradYear) + 's';
    const findRole = member.guild?.roles.cache.find((role) => role?.name === newYearRoleName);

    if (!findRole && member.guild?.roles) {
      await createNewRole(newYearRoleName, member.guild.roles);
    }
    // assign that role to the user
    updateMemberRole(member, newYearRoleName, addOrRemove.add);
  }

  // final step: remove their existing year role
  // grab oldYear from database - as this call happens before db update
  const oldProfileDetails: UserProfile | undefined = await getUserProfileById(member.id);
  const oldYear = oldProfileDetails?.year;
  if (oldYear) {
    let roleToRemove = oldYear.toString();
    if (oldYear < validRoleYears.validRoleYearStart) {
      // while profile year may be something like 2008, the role itself is called 2000s so have to convert
      roleToRemove = yearToDecade(oldYear).toString() + 's';
    }
    if (newYearRoleName !== roleToRemove) {
      updateMemberRole(member, roleToRemove, addOrRemove.remove);
    }
  }
};
