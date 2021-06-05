// Codey suggest Command
import Discord from 'discord.js';
import { openDB, testDb } from '../components/db';

export const suggestCmd = async (message: Discord.Message, args: string[]) => {
  try {
    // save suggestion into DB
    const db = openDB();
    const state = 'C'; // Create state = C
    var words = '';
    var word = '';
    // Turn args into suggestion
    for (word in args) {
      words += word + ' ';
    }

    (await db).run('INSERT INTO suggestions(suggestion_author, suggestion, suggestion_state) VALUES(?,?,?);', [
      message.id,
      words,
      state
    ]);

    // confirm suggestion was taken
    message.channel.send('Codey has recieved your suggestion.');
  } catch (err) {
    // Error message
    message.channel.send('Sorry! There has been an error. Please try again later or let a mod know this happened.');
  }
};
