import { openDB } from './db';
import Discord from 'discord.js';
import _ from 'lodash';

const RESULTS_PER_PAGE = 6;
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
  const response =
    "I can't seem to recognize your command; the commands I know for interviewers are: \n" +
    ' ```.interviewer signup [calendly/xai link] \n//signs up or update your calendar link```' +
    ' ```.interviewer list (domain) \n//shows list of available interviewers, with optional domain filter```' +
    ' ```.interviewer domain [domain] \n//adds or removes you from a domain``` ';
  await message.channel.send(response);
}

async function addInterviewer(message: Discord.Message, args: string[]): Promise<void> {
  const db = await openDB();
  const id = message.author.id;

  //checks for existence of link arg
  const link = args.shift();
  if (!link) {
    help(message);
    return;
  }

  //parses link and checks for validity
  const parsedLink = parseLink(link);
  if (!parsedLink) {
    message.channel.send(`Hmmm... I don't seem to recognize your meeting link. Be sure to use calendly or x.ai.`);
    return;
  }

  //checks if user is already an interviewer, adds/updates info accordingly
  const res = await db.get('SELECT * FROM interviewers WHERE user_id = ?', id);
  if (!res) {
    db.run('INSERT INTO interviewers (user_id, link) VALUES(? , ?)', id, parsedLink);
    message.channel.send(`<@${id}>, your info has been added. Thanks for helping out! :codeyLove:`);
  } else {
    db.run('UPDATE interviewers SET link = ? WHERE user_id = ?', parsedLink, id);
    message.channel.send(`<@${id}>, your info has been changed.`);
  }
}

async function listInterviewers(message: Discord.Message, client: Discord.Client, args: string[]): Promise<void> {
  const db = await openDB();
  let res: Interviewer[];
  let domain = args.shift();
  if (domain) domain = domain.toLowerCase();
  let title = 'Available interviewers';
  console.log(domain);
  //checks if domain arg is passed and is valid, runs list without filters otherwise
  if (!domain || !(domain in available_domains)) {
    if (domain) {
      let output = 'Not a valid domain, valid domains are:';
      for (const val of Object.values(available_domains)) {
        output += ' ' + val;
      }
      await message.channel.send(output);
    }
    res = await db.all('SELECT * FROM interviewers');
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
  await message.channel.send(outEmbed);
}

async function clearProfile(message: Discord.Message): Promise<void> {
  const db = await openDB();
  const id = message.author.id;

  //clear user data from both tables
  await db.run('DELETE FROM interviewers WHERE user_id = ?', id);
  await db.run('DELETE FROM domains WHERE user_id = ?', id);
  await message.channel.send('Your interviewer data has been cleared!');
}

async function showProfile(message: Discord.Message): Promise<void> {
  const db = await openDB();
  const id = message.author.id;

  //check if user signed up to be interviewer
  const interviewer = await db.get('SELECT * FROM interviewers WHERE user_id = ?', id);
  if (!interviewer) {
    await message.channel.send("You don't seem to have signed up yet, run ```.interviewer signup [link]```");
    return;
  }

  //get user's domains (if any)
  const res = await db.all('SELECT * FROM domains WHERE user_id = ?', id);
  let domains = '';
  for (const i of res) {
    domains += available_domains[i.domain] + ' ';
  }

  //build output embed
  const outEmbed = new Discord.MessageEmbed().setColor('#0099ff').setTitle('Interviewer Profile');
  outEmbed.addField('**Link**', interviewer['link']);
  outEmbed.addField('**Domains**', domains === '' ? 'None' : domains);
  await message.channel.send(outEmbed);
}

async function addDomain(message: Discord.Message, args: string[]): Promise<void> {
  const db = await openDB();
  const id = message.author.id;

  //get domain and check arg passed
  let domain = args.shift();
  if (!domain) {
    help(message);
    return;
  }

  //parse domain to lowercase and check if valid
  domain = domain.toLowerCase();
  if (!(domain in available_domains)) {
    let output = 'Not a valid domain, valid domains are:';
    for (const i of Object.values(available_domains)) {
      output += ' ' + i;
    }
    await message.channel.send(output);
    return;
  }

  //check user signed up to be an interviewer
  const interviewer = await db.get('SELECT * FROM interviewers WHERE user_id = ?', id);
  if (!interviewer) {
    await message.channel.send("You don't seem to have signed up yet, run ```.interviewer signup [link]```");
    return;
  }

  //check if user already in domain
  const res = await db.get('SELECT * FROM domains WHERE user_id = ? AND domain = ?', id, domain);

  //toggles on/off user's domain
  if (!res) {
    db.run('INSERT INTO domains (user_id, domain) VALUES(?, ?)', id, domain);
    await message.channel.send('You have been successfully added to ' + available_domains[domain]);
  } else {
    db.run('DELETE FROM domains WHERE user_id = ? AND domain = ?', id, domain);
    await message.channel.send('You have been successfully removed from ' + available_domains[domain]);
  }
}
