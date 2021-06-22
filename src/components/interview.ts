import Discord from 'discord.js';
import _ from 'lodash';
import { Database } from 'sqlite';

import { openDB } from './db';

//maps from key to readable string
export const availableDomains: { [key: string]: string } = {
  frontend: 'Frontend',
  backend: 'Backend',
  design: 'Design',
  pm: 'PM'
};

export interface Interviewer {
  user_id: string;
  link: string;
}

export const initInterviewTables = async (db: Database): Promise<void> => {
  await db.run('CREATE TABLE IF NOT EXISTS interviewers (user_id TEXT PRIMARY KEY, link TEXT NOT NULL)');
  await db.run('CREATE TABLE IF NOT EXISTS domains (user_id TEXT NOT NULL, domain TEXT NOT NULL)');
  await db.run('CREATE INDEX IF NOT EXISTS ix_domains_domain ON domains (domain)');
};

async function getInterviewer(id: string) {
  const db = await openDB();
  return await db.get('SELECT * FROM interviewers WHERE user_id = ?', id);
}

export const getDomainString = (domains: { [key: string]: string }): string => _.join(Object.values(domains), ', ');

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

async function help(message: Discord.Message): Promise<void> {
  //should be deprecated as soon as proper help handler is built.
  const response = new Discord.MessageEmbed()
    .setTitle('Help')
    .setColor('#0099ff')
    .setDescription("I can't seem to recognize your command; the commands I know for interviewers are:")
    .addFields(
      { name: 'Interviewer Signup', value: '`.interviewer signup [calendly/xai link]`' },
      { name: 'Get Interviewer List', value: '`.interviewer list (domain)`' },
      { name: 'Add Interviewer Domain', value: '`.interviewer domain [domain]`' },
      { name: 'Show Interviewer Profile', value: '`.interviewer profile`' },
      { name: 'Clear Profile', value: '`.interviewer clear`' },
      { name: 'Available Domains', value: '`' + getDomainString(availableDomains) + '`' }
    );
  await message.reply(response);
}

export const upsertInterviewer = async (id: string, calendarUrl: string): Promise<void> => {
  const db = await openDB();

  //checks if user is already an interviewer, adds/updates info accordingly
  if (!(await getInterviewer(id))) {
    db.run('INSERT INTO interviewers (user_id, link) VALUES(? , ?)', id, calendarUrl);
  } else {
    db.run('UPDATE interviewers SET link = ? WHERE user_id = ?', calendarUrl, id);
  }
};

/*
  Returns a list of interviewers by domain, if a domain is specified.
  Throws an error if domain is not a valid key in availableDomains.
*/
export const getInterviewers = async (domain: string | null): Promise<Interviewer[]> => {
  const db = await openDB();
  let res: Interviewer[];

  if (!domain) {
    // no domain specified, query for all interviewers
    res = await db.all('SELECT * FROM interviewers');
  } else if (!(domain in availableDomains)) {
    // domain not a valid key in availableDomains
    throw 'Invalid domain.';
  } else {
    // query interviewers by domain
    res = await db.all(
      'SELECT * FROM interviewers WHERE user_id IN (SELECT user_id FROM domains WHERE domain = ?)',
      domain
    );
  }

  return res;
};

async function clearProfile(message: Discord.Message): Promise<void> {
  const db = await openDB();
  const { id } = message.author;

  //clear user data from both tables
  await db.run('DELETE FROM interviewers WHERE user_id = ?', id);
  await db.run('DELETE FROM domains WHERE user_id = ?', id);
  await message.reply('Your interviewer data has been cleared!');
}

async function showProfile(message: Discord.Message): Promise<void> {
  const db = await openDB();
  const { id } = message.author;

  //check if user signed up to be interviewer
  const interviewer = await getInterviewer(id);
  if (!interviewer) {
    await message.reply("You don't seem to have signed up yet, run `.interviewer signup [link]`");
    return;
  }

  //get user's domains (if any)
  const res = await db.all('SELECT * FROM domains WHERE user_id = ?', id);
  const domains = _.join(
    res.map((x) => availableDomains[x.domain]),
    ', '
  );

  //build output embed
  const outEmbed = new Discord.MessageEmbed().setColor('#0099ff').setTitle('Interviewer Profile');
  outEmbed.addField('**Link**', interviewer['link']);
  outEmbed.addField('**Domains**', domains === '' ? 'None' : domains);
  await message.reply(outEmbed);
}

async function addDomain(message: Discord.Message, args: string[]): Promise<void> {
  const db = await openDB();
  const { id } = message.author;

  //check user signed up to be an interviewer
  if (!(await getInterviewer(id))) {
    await message.reply("You don't seem to have signed up yet, run ```.interviewer signup [link]```");
    return;
  }

  //get domain and check arg passed
  const domain = args.length == 1 ? args[0].toLowerCase() : null;
  if (!domain) {
    help(message);
    return;
  }

  //check if domain valid
  if (!(domain in availableDomains)) {
    await message.reply('Not a valid domain, valid domains are: ' + getDomainString(availableDomains));
    return;
  }

  //check if user already in domain
  const inDomain = await db.get('SELECT * FROM domains WHERE user_id = ? AND domain = ?', id, domain);

  //toggles on/off user's domain
  if (!inDomain) {
    db.run('INSERT INTO domains (user_id, domain) VALUES(?, ?)', id, domain);
    await message.reply('You have been successfully added to ' + availableDomains[domain]);
  } else {
    db.run('DELETE FROM domains WHERE user_id = ? AND domain = ?', id, domain);
    await message.reply('You have been successfully removed from ' + availableDomains[domain]);
  }
}
