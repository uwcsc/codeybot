import _ from 'lodash';
import { Database } from 'sqlite';
import { openDB } from './db';

// maps from key to readable string
export const suggestionStates: { [key: string]: string } = {
  created: 'Created',
  pending: 'Pending',
  rejected: 'Rejected',
  actionable: 'Actionable',
  accepted: 'Accepted'
};

export const getListsString = (List: string[]): string => _.join(List, ', ');

export const getAvailableStatesString = (): string => getListsString(Object.values(suggestionStates));

export interface Suggestion {
  id: string;
  author_id: string;
  author_username: string;
  created_at: string;
  suggestion: string;
  state: string;
}

export const initSuggestionsTable = async (db: Database): Promise<void> => {
  await db.run(
    `
    CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY NOT NULL,
      author_id VARCHAR(255) NOT NULL,
      author_username TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      suggestion TEXT NOT NULL,
      state VARCHAR(255) NOT NULL
    );
    `
  );
};

export const addSuggestion = async (
  authorId: string,
  authorUsername: string,
  suggestion: string,
  state: string = suggestionStates['created']
): Promise<void> => {
  const db = await openDB();

  // Save suggestion into DB
  await db.run(
    `
    INSERT INTO suggestions (author_id, author_username, suggestion, state)
    VALUES(?,?,?,?);
    `,
    [authorId, authorUsername, suggestion, state]
  );
};

export const updateSuggestionCron = async (state = 'pending', oldState = 'created'): Promise<boolean> => {
  const db = await openDB();
  const numOfCreated = (await getSuggestions(oldState)).length;

  if (numOfCreated === 0) {
    return false;
  }
  // Update created suggestions to pending suggestions in DB
  await db.run(
    `
    UPDATE suggestions
    SET state = ?
    WHERE state = ?;
    `,
    [suggestionStates[state], suggestionStates[oldState]]
  );

  return true;
};

export const getSuggestions = async (state: string | null): Promise<Suggestion[]> => {
  const db = await openDB();
  let res: Suggestion[];

  if (!state) {
    // no state specified, query for all suggestions
    res = await db.all('SELECT * FROM suggestions ORDER BY created_at DESC');
  } else if (!(state in suggestionStates)) {
    // state not a valid key in suggestionStates
    throw 'Invalid state.';
  } else {
    // query suggestions by state
    res = await db.all('SELECT * FROM suggestions WHERE state = ? ORDER BY created_at DESC', suggestionStates[state]);
  }

  return res;
};
