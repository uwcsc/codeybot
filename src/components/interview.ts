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
      listInterviewers(message, client);
      break;
    default:
      help(message);
      break;
  }
}

export async function help(message: Discord.Message) {
  let response =
    "I can't seem to recognize your command; the commands I know for interviewers are: \n" +
    ' ```.interviewer signup [calendly/xai link] ``` \n' +
    ' ```.interviewer list ```';
  await message.channel.send(response);
}

export async function addInterviewer(message: Discord.Message, args: string[]) {
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
  const res = await db.get('SELECT * FROM Interviewers WHERE UserID = ?', id);
  if (res == undefined) {
    db.run('INSERT INTO Interviewers (UserId, Link) VALUES(? , ?)', id, parsedLink);
    message.channel.send(`<@${id}>, your info has been added. Thanks for signing up to help out! :codeyLove:`);
  } else {
    db.run('UPDATE Interviewers SET Link = ? WHERE UserID = ?', parsedLink, id);
    message.channel.send(`<@${id}>, your info has been changed.`);
  }
}

export async function listInterviewers(message: Discord.Message, client: Discord.Client) {
  const db = await openDB();
  const res = shuffleArray(await db.all('SELECT * FROM Interviewers'));

  let outEmbed = new Discord.MessageEmbed().setColor('#0099ff').setTitle('Available Interviewers');
  let listString: String = '';
  let count: number = 0;
  for (const rows of res) {
    if (count == 6) break;
    count++;
    console.log(rows.UserId.toString());
    listString +=
      '**' + (await client.users.fetch(rows['UserId'].toString())).tag + '** | [Calendar](' + rows['Link'] + ')\n\n';
  }
  outEmbed.setDescription(listString);
  await message.channel.send(outEmbed);
}

function shuffleArray(array: Interviewer[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
