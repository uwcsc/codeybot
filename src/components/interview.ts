import { openDB } from './db';
import Discord from 'discord.js';
import _ from 'lodash';

const RESULTS_PER_PAGE = 6;

interface Interviewer {
  user_id: number;
  link: string;
}

function parseLink(link: string) {
  if (link.includes('calendly.com') || link.includes('x.ai')) {
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
      listInterviewers(message, client);
      break;
    default:
      help(message);
      break;
  }
}

async function help(message: Discord.Message): Promise<void> {
  const response =
    "I can't seem to recognize your command; the commands I know for interviewers are: \n" +
    ' ```.interviewer signup [calendly/xai link] ``` \n' +
    ' ```.interviewer list ```';
  await message.channel.send(response);
}

async function addInterviewer(message: Discord.Message, args: string[]): Promise<void> {
  const db = await openDB();
  const id = message.author.id;
  const link = args.shift();
  if (!link) {
    help(message);
    return;
  }
  const parsedLink = parseLink(link);
  if (!parsedLink) {
    message.channel.send(`Hmmm... I don't seem to recognize your meeting link. Be sure to use calendly or x.ai.`);
    return;
  }
  const res = await db.get('SELECT * FROM interviewers WHERE user_id = ?', id);
  if (!res) {
    db.run('INSERT INTO interviewers (user_id, link) VALUES(? , ?)', id, parsedLink);
    message.channel.send(`<@${id}>, your info has been added. Thanks for signing up to help out! :codeyLove:`);
  } else {
    db.run('UPDATE interviewers SET link = ? WHERE user_id = ?', parsedLink, id);
    message.channel.send(`<@${id}>, your info has been changed.`);
  }
}

async function listInterviewers(message: Discord.Message, client: Discord.Client): Promise<void> {
  const db = await openDB();
  const res = _.shuffle(await db.all('SELECT * FROM interviewers')) as Interviewer[];

  const outEmbed = new Discord.MessageEmbed().setColor('#0099ff').setTitle('Available Interviewers');
  let listString = '';
  let count = 0;
  for (const rows of res) {
    if (count == RESULTS_PER_PAGE) break;
    count++;
    listString +=
      '**' + (await client.users.fetch(rows['user_id'].toString())).tag + '** | [Calendar](' + rows['link'] + ')\n\n';
  }
  outEmbed.setDescription(listString);
  await message.channel.send(outEmbed);
}
