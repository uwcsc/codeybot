import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import Discord from 'discord.js';

let db: Database | null = null;

export const openDB = async (): Promise<Database> => {
  if (db == null) {
    db = await open({
      filename: 'db/bot.db',
      driver: sqlite3.Database
    });
    //initialize all relevant tables
    await db.run('CREATE TABLE IF NOT EXISTS saved_data (msg_id INTEGER PRIMARY KEY,data TEXT NOT NULL);');
    await db.run('CREATE TABLE IF NOT EXISTS Interviewers (UserId TEXT, Link TEXT)');
  }
  return db;
};

export const testDb = async (message: Discord.Message, command: string, args: string[]): Promise<void> => {
  switch (command) {
    case 'save':
      if (args.length < 1) {
        await message.channel.send('no args');
        return;
      }
      await openDB().then((db) => {
        db.run('INSERT INTO saved_data (msg_id,data)' + 'VALUES(?,?)', [message.id, args[0]]);
      });
      await message.channel.send('Saved ' + args[0] + ' with id ' + message.id);
      break;
    case 'dump':
      await openDB().then(async (db) => {
        const flag = true;
        let outEmbed = new Discord.MessageEmbed()
          .setColor('#0099ff')
          .setTitle('Database Dump')
          .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        const res = await db.all('SELECT * FROM saved_data');
        for (const rows of res) {
          console.log(rows['msg_id'], rows['data']);
          outEmbed = outEmbed.addField(rows['msg_id'], rows['data'], true);
          console.log(outEmbed);
        }
        console.log(outEmbed);
        if (flag) {
          if (outEmbed.fields.length == 0) {
            await message.channel.send('empty');
          } else {
            await message.channel.send(outEmbed);
          }
        } else {
          await message.channel.send('error');
        }
      });
      break;
    case 'clear':
      openDB()
        .then((db) => {
          return db.run('DELETE FROM saved_data');
        })
        .then(async () => {
          await message.channel.send('cleared');
        })
        .catch();
      break;
  }
};

console.log('connected to db');
