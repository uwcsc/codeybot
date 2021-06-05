// Codey suggest Command
import Discord from 'discord.js';
import { openDB } from '../components/db';

export const suggestCmd = async (message: Discord.Message, args: string[]) => {
  const db = openDB();
  const state = 'create';
  const helpArg = 'help';
  let words = '';
  let word = '';
  // Turn args into suggestion
  for (word in args) {
    words += args[word] + ' ';
  }

  console.log('!' + args[0] + '!');

  if (words == '') {
    message.channel.send('Codey sees an empty suggestion! Try again.');
  } else if (args[0].toLowerCase() === helpArg) {
    message.channel.send(
      '.suggest <suggestion> \nYour <suggestion> should only contain text and is capped at about 100 words.'
    );
  } else {
    // Save suggestion into DB
    (
      await db
    ).run('INSERT INTO suggestions (suggestion_id, suggestion_author, suggestion, suggestion_state) VALUES(?,?,?,?);', [
      null,
      message.author.id,
      words,
      state
    ]);

    // Confirm suggestion was taken
    message.channel.send('Codey has received your suggestion.');
  }
};
