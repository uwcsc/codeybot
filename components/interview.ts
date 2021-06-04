import { openDB } from './db';
import Discord from 'discord.js';
import extractDomain from 'extract-domain';

interface Interviewer{
  UserId: number;
  Link: string;
}

function verifyLink(link: string){
  const domain = extractDomain(link);
  console.log("test"+domain);
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
  verifyLink(link);
  const res = await db.get('SELECT * FROM Interviewers WHERE UserID = ?', id);
  if (res == undefined) {
    db.run('INSERT INTO Interviewers (UserId, Link) VALUES(? , ?)', id, link);
    message.channel.send(`<@${id}>, your info has been added. Thanks for signing up to help out! :codeyLove:`);
  } else {
    db.run('UPDATE Interviewers SET Link = ? WHERE UserID = ?',link, id);
    message.channel.send(`<@${id}>, your info has been changed.`);
  }
}

export async function listInterviewers(message: Discord.Message, args: string[], client: Discord.Client) {
  const db = await openDB();
  const res = await db.all('SELECT * FROM Interviewers');
  console.log(res);
  let outEmbed = new Discord.MessageEmbed()
  .setColor('#0099ff')
  .setTitle('Interviewers');
  for (const rows of res){
    console.log(rows.UserId.toString())
    outEmbed = outEmbed.addField((await client.users.fetch(rows['UserId'].toString())).tag, rows['Link'], true);
  }
  await message.channel.send(outEmbed);
}

function shuffleArray(array : Interviewer[]) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
