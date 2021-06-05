// Codey suggest Command
import Discord from 'discord.js';
import { openDB } from '../components/db';

/*
  // Keeping this here just to keep my debugging tools
  db.run('DROP TABLE suggestions');
  const res = await db.all('SELECT * FROM suggestions');
  for (const rows of res) {
    console.log(rows['id'], rows['created_at'], rows['author'], rows['suggestion'], rows['state']);
  }
*/

// All states of suggestion records
enum SuggestionStates {
  Create = 'Create',
  Rejected = 'Rejected',
  Accepted = 'Accepted',
  Pending = 'Pending'
}

export const suggestCmd = async (message: Discord.Message, args: string[]): Promise<void> => {
  const db = await openDB();

  const helpArg = 'help';
  let words = '';
  // Turn args into suggestion
  for (let word in args) {
    words += args[word] + ' ';
  }

  if (words == '') {
    message.channel.send('Codey sees an empty suggestion! Try again.');
  } else if (args[0].toLowerCase() === helpArg) {
    message.channel.send('.suggest <suggestion> \nYour <suggestion> should only contain text.');
  } else {
    // Save suggestion into DB
    db.run('INSERT INTO suggestions (author, suggestion, state) VALUES(?,?,?);', [
      message.author.id,
      words,
      SuggestionStates.Create
    ]);

    // Confirm suggestion was taken
    message.channel.send('Codey has received your suggestion.');
  }
};
