import sqlite3 = require('sqlite3');
import { open, Database } from 'sqlite';
import Discord from 'discord.js';

let db: Database | null = null;

export async function openDB() {
  if (db == null) {
    db = await open({
      filename: './db/bot.db',
      driver: sqlite3.Database
    });
    await db.run('CREATE TABLE IF NOT EXISTS saved_data (msg_id INTEGER PRIMARY KEY,data TEXT NOT NULL);');
    await db.run(
      'CREATE TABLE IF NOT EXISTS suggestions (suggestion_id INT AUTO_INCREMENT PRIMARY KEY,suggestion_author VARCHAR(255) NOT NULL,' +
        'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,suggestion VARCHAR(500) NOT NULL, suggestion_state VARCHAR(1) NOT NULL);'
    );
  }
  return db;
}

export async function testDb(message: Discord.Message, command: string, args: string[]) {
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
        let flag: boolean = true;
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
}

console.log('connected to db');
