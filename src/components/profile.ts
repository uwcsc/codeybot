import { container } from '@sapphire/framework';
import emojiRegex from 'emoji-regex';
import { GuildMember } from 'discord.js';
import { vars } from '../config';
import { addOrRemove, updateMemberRole } from '../utils/roles';
import { openDB } from './db';
import { getEmojiByName } from './emojis';

const TARGET_GUILD_ID: string = vars.TARGET_GUILD_ID;

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
  profile_emoji?: string;
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
// range of years that can be assigned as a role
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
  profile_emoji = 'profile_emoji',
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
  profile_emoji = 'Profile Emoji',
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
  profile_emoji: 'Your profile emoji.',
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
  profile_emoji = 'profile_emoji',
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
  if (customization !== validatedFields.term && customization != validatedFields.profile_emoji) {
    // convert to lowercase then first letter to capital, in case the user doesn't use proper capitalization
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
    case validatedFields.profile_emoji:
      if (getEmojiByName(parsedDescription) === undefined) {
        const emojiRegexToCheck = emojiRegex();
        if (!parsedDescription.match(emojiRegexToCheck)) {
          return { reason: 'Invalid profile emoji given ' + parsedDescription + '.' };
        }
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

  // if customization is year, then update grad roles as well
  if (customization === 'year') {
    // description here would be the new year role
    await updateMemberGradRoles(member, description);
  }

  if (user.found === 1) {
    // escape any instances of ' character by placing another ' in front of it by sqlite specifications
    if (customization != 'profile_emoji') {
      description.replace(/'/g, "''");
    }
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

const yearToDecade = (year: number): number => {
  return year - (year % 10);
};

const updateMemberGradRoles = async (member: GuildMember, gradYear: number): Promise<void> => {
  // no roles created if gradYear is < 1900 (impossible)
  if (gradYear < 1900) {
    return;
  }

  // user should have Alumni role iff they have graduated
  updateMemberRole(member, 'Alumni', gradYear < currentYear ? addOrRemove.add : addOrRemove.remove);

  const newYearRoleName =
    gradYear >= validRoleYears.validRoleYearStart
      ? gradYear.toString()
      : // otherwise, decade role. e.g: 1980s, 1990s, etc.
        yearToDecade(gradYear) + 's';
  updateMemberRole(member, newYearRoleName, addOrRemove.add);

  // final step: remove their existing year role
  // grab oldYear from database - as this call happens before db update
  const oldProfileDetails: UserProfile | undefined = await getUserProfileById(member.id);
  const oldYear = oldProfileDetails?.year;
  if (oldYear) {
    let roleToRemove = oldYear.toString();
    if (oldYear < validRoleYears.validRoleYearStart) {
      // while profile year may be something like 2008, the role itself is called 2000s so have to convert
      roleToRemove = yearToDecade(oldYear) + 's';
    }
    if (newYearRoleName !== roleToRemove) {
      updateMemberRole(member, roleToRemove, addOrRemove.remove);
    }
  }
};

export const assignDecadeAndPruneYearRoles = async (): Promise<void> => {
  const guild = await container.client.guilds.fetch(TARGET_GUILD_ID);
  (await guild.roles.fetch())
    .filter((role) => {
      const roleNameNum = Number(role.name);
      return Number.isInteger(roleNameNum) && roleNameNum < validRoleYears.validRoleYearStart;
    })
    .forEach((role) => {
      const roleMembers = role.members;
      const decadeRoleName = yearToDecade(Number(role.name)) + 's';
      roleMembers.forEach((member) => updateMemberRole(member, decadeRoleName, addOrRemove.add));
      guild.roles.delete(role);
    });
};

export const assignAlumniRole = async (): Promise<void> => {
  (await (await container.client.guilds.fetch(TARGET_GUILD_ID)).roles.fetch())
    .filter((role) => {
      const roleNameNum = Number(role.name);
      if (Number.isInteger(roleNameNum)) {
        // individual year role
        return roleNameNum < new Date().getFullYear();
      }
      // decade role
      return Number.isInteger(Number(role.name.slice(0, -1))) && role.name.slice(-1) === 's';
    })
    .forEach((role) =>
      role.members.forEach((member) => updateMemberRole(member, 'Alumni', addOrRemove.add)),
    );
};
