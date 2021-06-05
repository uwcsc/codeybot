// Codey suggest Command
import Discord from 'discord.js';
import { openDB } from '../components/db';

export const suggestCmd = async (message: Discord.Message, args: string[]) => {
  const db = openDB();
  const state = 'C'; // Create state = C
  const helpArg = 'help ';
  var words = '';
  var word = '';
  // Turn args into suggestion
  for (word in args) {
    words += args[word] + ' ';
  }

  if (words == '') {
    message.channel.send('Codey sees an empty suggestion! Try again.');
  } else if (words == helpArg) {
    message.channel.send(
      '.suggest <suggestion> \nYour <suggestion> should only contain text and is capped at about 100 words.'
    );
  } else {
    try {
      // Save suggestion into DB
      (
        await db
      ).run(
        'INSERT INTO suggestions (suggestion_id, suggestion_author, suggestion, suggestion_state) VALUES(?,?,?,?);',
        [null, message.author.id, words, state]
      );

      // Confirm suggestion was taken
      message.channel.send('Codey has recieved your suggestion.');
    } catch (err) {
      // Error message
      message.channel.send(
        'Sorry! There has been an error: ' + err + '\nPlease try again later or let a mod know this happened.'
      );
    }
  }
};
