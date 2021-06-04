import { openDB } from './db';
import Discord from 'discord.js';

interface Interviewer {
  UserId: number;
  Link: string;
}

function parseLink(link: string) {
  if (link.includes('calendly.com') || link.includes('x.ai')) {
    if (!link.startsWith('http')) {
      link = 'https://' + link;
    }
    return link;
  } else {
    return undefined;
  }
}

export async function handleInterview(message: Discord.Message, args: string[], client: Discord.Client) {
  const command = args.shift();
  switch (command) {
    case 'signup':
      addInterviewer(message, args);
      break;
    case 'list':
      listInterviewers(message, args, client);
      break;
    default:
      break;
  }
}

export async function addInterviewer(message: Discord.Message, args: string[]) {
  const db = await openDB();
  const id = message.author.id;
  console.log(id);
  const link = args.shift();
  if (!link) {
    message.channel.send('Missing arguments: ```Usage: .interviewer [name] [calendar-link]```');
    return;
  }
  const parsedLink = parseLink(link);
  if (!parsedLink) {
    message.channel.send(`Hmmm... I don't seem to recognize your meeting link. Be sure to use calendly or x.ai.`);
    return;
  }
  const res = await db.get('SELECT * FROM Interviewers WHERE UserID = ?', id);
  if (res == undefined) {
    db.run('INSERT INTO Interviewers (UserId, Link) VALUES(? , ?)', id, parsedLink);
    message.channel.send(`<@${id}>, your info has been added. Thanks for signing up to help out! :codeyLove:`);
  } else {
    db.run('UPDATE Interviewers SET Link = ? WHERE UserID = ?', parsedLink, id);
    message.channel.send(`<@${id}>, your info has been changed.`);
  }
}

export async function listInterviewers(message: Discord.Message, args: string[], client: Discord.Client) {
  const db = await openDB();
  const res = shuffleArray(await db.all('SELECT * FROM Interviewers'));
  console.log(res);
  let outEmbed = new Discord.MessageEmbed().setColor('#0099ff').setTitle('Interviewers');
  for (const rows of res) {
    console.log(rows.UserId.toString());
    outEmbed = outEmbed.addField('\u200B', (await client.users.fetch(rows['UserId'].toString())).tag, true);
    outEmbed = outEmbed.addField('\u200B', '\u200B', true);
    outEmbed = outEmbed.addField('\u200B', rows['Link'], true);
  }
  await message.channel.send(outEmbed);
}

function shuffleArray(array: Interviewer[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
