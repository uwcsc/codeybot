// Codey suggest Command
import Discord from 'discord.js';
import { openDB, testDb } from '../components/db';

export const suggestCmd = async (message: Discord.Message, args: string[]) => {
  try {
    // save suggestion into DB
    const state = 'C'; // Create state = C
    const db = openDB();
    var words = '';
    var word = '';
    for (word in args) {
      words += word + ' ';
    }

    (await db).run(
      'BEGIN TRANSACTION;' +
        'CREATE TABLE IF NOT EXISTS suggestions (' +
        '    suggestion_id IDENTITY(1,1) PRIMARY KEY,' +
        '    suggestion_author VARCHAR(255) NOT NULL,' +
        '    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,' +
        '    suggestion VARCHAR(500) NOT NULL,' +
        '    suggestion_state VARCHAR(1) NOT NULL' +
        ');' +
        'INSERT INTO suggestions(suggestion_author, suggestion, suggestion_state)' +
        '    VALUES(' +
        message.id +
        ', ' +
        words +
        ', ' +
        state +
        ');' +
        'COMMIT;'
    );

    // confirm suggestion was taken
    message.channel.send('Codey has recieved your suggestion: ' + args[0] + ' ' + args[1] + ' ' + args[2] + '... ');
  } catch (err) {
    // Error message
    message.channel.send('Sorry! There has been an error. Please try again later or let a mod know this happened.');
  }
};
