import { openDB } from './db';
import Discord from 'discord.js';
import _ from 'lodash';

const RESULTS_PER_PAGE = 6;

//maps from key to readable string
const available_domains: { [key: string]: string } = {
  frontend: 'Frontend',
  backend: 'Backend',
  design: 'Design',
  pm: 'PM'
};

interface Interviewer {
  user_id: string;
  link: string;
}

async function getInterviewer(id: string) {
  const db = await openDB();
  return await db.get('SELECT * FROM interviewers WHERE user_id = ?', id);
}

const getDomainString = (domains: { [key: string]: string }) => _.join(Object.values(domains), ', ');

function parseLink(link: string) {
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
}

export async function handleInterview(message: Discord.Message, args: string[], client: Discord.Client): Promise<void> {
  const command = args.shift();
  switch (command) {
    case 'signup':
      addInterviewer(message, args);
      break;
    case 'list':
      listInterviewers(message, client, args);
      break;
    case 'domain':
      addDomain(message, args);
      break;
    case 'profile':
      showProfile(message);
      break;
    case 'clear':
      clearProfile(message);
      break;
    default:
      help(message);
      break;
  }
}

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
      { name: 'Available Domains', value: '`' + getDomainString(available_domains) + '`' }
    );
  await message.reply(response);
}

async function addInterviewer(message: Discord.Message, args: string[]): Promise<void> {
  const db = await openDB();
  const { id } = message.author;

  //checks for existence of link arg
  const link = args.length == 1 ? args[0].toLowerCase() : null;
  if (!link) {
    help(message);
    return;
  }

  //parses link and checks for validity
  const parsedLink = parseLink(link);
  if (!parsedLink) {
    message.reply(`Hmmm... I don't seem to recognize your meeting link. Be sure to use calendly or x.ai.`);
    return;
  }

  //checks if user is already an interviewer, adds/updates info accordingly
  if (!(await getInterviewer(id))) {
    db.run('INSERT INTO interviewers (user_id, link) VALUES(? , ?)', id, parsedLink);
    message.reply(`Your info has been added. Thanks for helping out!`);
  } else {
    db.run('UPDATE interviewers SET link = ? WHERE user_id = ?', parsedLink, id);
    message.reply(`Your info has been changed.`);
  }
}

async function listInterviewers(message: Discord.Message, client: Discord.Client, args: string[]): Promise<void> {
  const db = await openDB();
  let res: Interviewer[];
  const domain = args.length == 1 ? args[0].toLowerCase() : null;
  let title = 'Available interviewers';

  //checks if domain arg is passed and is valid, runs list without filters otherwise
  if (!domain) {
    res = await db.all('SELECT * FROM interviewers');
  } else if (!(domain in available_domains)) {
    await message.reply('Not a valid domain, valid domains are: ' + getDomainString(available_domains));
    return;
  } else {
    res = await db.all(
      'SELECT * FROM interviewers WHERE user_id IN (SELECT user_id FROM domains WHERE domain = ?)',
      domain
    );
    title = 'Available interviewers for ' + available_domains[domain];
  }

  //shuffles and prints the results thru embed
  res = _.shuffle(res) as Interviewer[];
  const outEmbed = new Discord.MessageEmbed().setColor('#0099ff').setTitle(title);
  let listString = '';
  for (let count = 0; count < RESULTS_PER_PAGE && count < res.length; count++) {
    const rows = res[count];
    listString +=
      '**' + (await client.users.fetch(rows['user_id'].toString())).tag + '** | [Calendar](' + rows['link'] + ')\n\n';
  }
  outEmbed.setDescription(listString);
  await message.reply(outEmbed);
}

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
    res.map((x) => available_domains[x.domain]),
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
  if (!(domain in available_domains)) {
    await message.reply('Not a valid domain, valid domains are: ' + getDomainString(available_domains));
    return;
  }

  //check if user already in domain
  const inDomain = await db.get('SELECT * FROM domains WHERE user_id = ? AND domain = ?', id, domain);

  //toggles on/off user's domain
  if (!inDomain) {
    db.run('INSERT INTO domains (user_id, domain) VALUES(?, ?)', id, domain);
    await message.reply('You have been successfully added to ' + available_domains[domain]);
  } else {
    db.run('DELETE FROM domains WHERE user_id = ? AND domain = ?', id, domain);
    await message.reply('You have been successfully removed from ' + available_domains[domain]);
  }
}
