import _ from 'lodash';
import { Database } from 'sqlite';

import { openDB } from './db';

//maps from key to readable string
export const availableDomains: { [key: string]: string } = {
  backend: 'Backend',
  datasci: 'DataSci',
  design: 'Design',
  frontend: 'Frontend',
  gamedev: 'GameDev',
  hardware: 'Hardware',
  infra: 'Infra',
  mobile: 'Mobile',
  pm: 'PM',
  research: 'Research'
};

export interface Interviewer {
  user_id: string;
  link: string;
  status: number;
}

export enum Status {
  Active,
  Paused
}

export const initInterviewTables = async (db: Database): Promise<void> => {
  await db.run(`CREATE TABLE IF NOT EXISTS interviewers
               (user_id TEXT PRIMARY KEY, link TEXT NOT NULL, status INTEGER NOT NULL DEFAULT 0)`);
  await db.run('CREATE TABLE IF NOT EXISTS domains (user_id TEXT NOT NULL, domain TEXT NOT NULL)');
  await db.run('CREATE INDEX IF NOT EXISTS ix_domains_domain ON domains (domain)');
};

export const getInterviewer = async (id: string): Promise<Interviewer | undefined> => {
  const db = await openDB();
  return await db.get('SELECT * FROM interviewers WHERE user_id = ?', id);
};

export const getDomainsString = (domains: string[]): string => `\`${_.join(domains, '`, `')}\``;

export const getAvailableDomainsString = (): string => getDomainsString(Object.keys(availableDomains).sort());

export const parseLink = (link: string): string | null => {
  //checks if link is (roughly) one from calendly or x.ai
  if (link.includes('calendly.com') || link.includes('calendar.x.ai')) {
    //adds https if no http start (helpful for discord link formatting)
    if (!link.startsWith('http')) {
      link = 'https://' + link;
    }
    return link;
  } else {
    return null;
  }
};

/*
  If interviewer doesn't exist, save the interviewer and their calendar link.
  Otherwise, update the interviewer's calendar link.
*/
export const upsertInterviewer = async (id: string, calendarUrl: string): Promise<void> => {
  const db = await openDB();

  //checks if user is already an interviewer, adds/updates info accordingly
  if (!(await getInterviewer(id))) {
    await db.run('INSERT INTO interviewers (user_id, link, status) VALUES(?, ?, ?)', id, calendarUrl, Status.Active);
  } else {
    await db.run('UPDATE interviewers SET link = ? WHERE user_id = ?', calendarUrl, id);
  }
};

/*
  Returns a list of interviewers by domain, if a domain is specified.
  Throws an error if domain is not a valid key in availableDomains.
  By default, only active interviewers will be returned.
*/
export const getInterviewers = async (
  domain: string | null,
  status: number = Status.Active
): Promise<Interviewer[]> => {
  const db = await openDB();
  let res: Interviewer[];

  if (!domain) {
    // no domain specified, query for all interviewers
    res = await db.all('SELECT * FROM interviewers WHERE status = ?', status);
  } else if (!(domain in availableDomains)) {
    // domain not a valid key in availableDomains
    throw 'Invalid domain.';
  } else {
    // query interviewers by domain
    res = await db.all(
      `SELECT * FROM interviewers WHERE user_id IN (SELECT user_id FROM domains WHERE domain = ?)
      AND status = ?`,
      domain,
      status
    );
  }

  return res;
};

export const getInterviewerDomainsString = async (id: string): Promise<string> => {
  const userDomains = await getDomains(id);
  if (userDomains.length === 0) {
    return ``;
  } else {
    return getDomainsString(userDomains);
  }
};

export const clearProfile = async (id: string): Promise<void> => {
  const db = await openDB();

  //clear user data from both tables
  await db.run('DELETE FROM domains WHERE user_id = ?', id);
  await db.run('DELETE FROM interviewers WHERE user_id = ?', id);
};

export const pauseProfile = async (id: string): Promise<void> => {
  const db = await openDB();

  // sets interviewer's status to paused
  await db.run('UPDATE interviewers SET status = ? WHERE user_id = ?', Status.Paused, id);
};

export const resumeProfile = async (id: string): Promise<void> => {
  const db = await openDB();

  // sets interviewer's status to active
  await db.run('UPDATE interviewers SET status = ? WHERE user_id = ?', Status.Active, id);
};

export const getDomains = async (id: string): Promise<string[]> => {
  const db = await openDB();

  //get user's domains (if any)
  const res = await db.all('SELECT domain FROM domains WHERE user_id = ?', id);
  return res.map((row) => availableDomains[row.domain]);
};

/*
  If domain already exists, remove interviewer from the domain and return true.
  If domain doesn't exist, add interviewer to the domain and return false.
  Throws an error if domain isn't provided or not valid.
*/
export const toggleDomain = async (id: string, domain: string): Promise<boolean> => {
  const db = await openDB();

  //check if domain valid
  if (!domain || !(domain in availableDomains)) {
    throw 'Invalid domain.';
  }

  //check if user already in domain
  const inDomain = await db.get('SELECT * FROM domains WHERE user_id = ? AND domain = ?', id, domain);

  //toggles on/off user's domain
  if (!inDomain) {
    await db.run('INSERT INTO domains (user_id, domain) VALUES(?, ?)', id, domain);
  } else {
    await db.run('DELETE FROM domains WHERE user_id = ? AND domain = ?', id, domain);
  }

  // cast to boolean
  return !!inDomain;
};
