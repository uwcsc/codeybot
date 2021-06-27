import _ from 'lodash';
import { Database } from 'sqlite';
import { openDB } from './db';

// maps from key to readable string
export const availableLists: { [key: string]: string } = {
  created: 'Created',
  pending: 'Pending',
  rejected: 'Rejected',
  actionable: 'Actionable',
  accepted: 'Accepted'
};

export const getListsString = (List: string[]): string => _.join(List, ', ');

export const getAvailableListsString = (): string => getListsString(Object.values(availableLists));

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
  state: string = availableLists['created']
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

export const getSuggestions = async (list: string | null): Promise<Suggestion[]> => {
  const db = await openDB();
  let res: Suggestion[];

  if (!list) {
    // no list specified, query for all suggestions
    res = await db.all('SELECT * FROM suggestions');
  } else if (!(list in availableLists)) {
    // list not a valid key in availableLists
    throw 'Invalid list.';
  } else {
    // query suggestions by list
    res = await db.all('SELECT * FROM suggestions WHERE state = ? ORDER BY created_at DESC', availableLists[list]);
  }

  return res;
};
