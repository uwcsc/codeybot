import { openDB } from './db';
import Discord from 'discord.js';

export async function initInterview() {
  await openDB().then(async (db) => {
    await db.run('CREATE TABLE IF NOT EXISTS Interviewers (UserId INTEGER PRIMARY KEY, Name TEXT, Link TEXT)');
  });
}

export async function addInterviewer(message: Discord.Message, args: string[]) {
  const id = message.author.id;
  const name = args.shift();
  const link = args.shift();
  if (!name || !link) {
    await message.channel.send("Missing arguments: ```Usage: .interviewer [name] [calendar-link]```");
    return;
  }
  await openDB().then(async (db) => {
    await db.get('SELECT * FROM Interviewers WHERE UserID = ?', id).then(async (res) => {
      if (res == undefined) {
        await db.run('INSERT INTO Interviewers (UserId, Name, Link) VALUES(? , ? , ?)', id, name, link);
        await message.channel.send(`<@${id}>, your info has been added.`);
      } else {
        await db.run('UPDATE Interviewers SET Name = ?, Link = ? WHERE UserID = ?', name, link, id);
        await message.channel.send(`<@${id}>, your info has been changed.`);
      }
    });
  });
}
