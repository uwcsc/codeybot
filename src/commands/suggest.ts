// Codey suggest Command
import Discord from 'discord.js';
import { openDB, testDb } from '../components/db';

export const suggestCmd = async (message: Discord.Message, args: string[]) => {
  const db = openDB();
  const state = 'C'; // Create state = C
  var words = '';
  var word = '';
  // Turn args into suggestion
  for (word in args) {
    words += args[word] + ' ';
  }

  try {
    // Save suggestion into DB
    (await db).run('INSERT INTO suggestions(suggestion_author, suggestion, suggestion_state) VALUES(?,?,?);', [
      message.id,
      words,
      state
    ]);

    // Confirm suggestion was taken
    message.channel.send('Codey has recieved your suggestion.');
  } catch (err) {
    // Error message
    message.channel.send('Sorry! There has been an error. Please try again later or let a mod know this happened.');
  }

  // To delete - just printing out stuff to see
  const res = await (await db).all('SELECT * FROM suggestions');
  for (const rows of res) {
    console.log(
      rows['suggestion_id'],
      rows['created_at'],
      rows['suggestion_author'],
      rows['suggestion'],
      rows['suggestion_state']
    );
  }
};
