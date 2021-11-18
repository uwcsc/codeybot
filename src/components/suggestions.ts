import _ from 'lodash';
import { Database } from 'sqlite';
import { openDB } from './db';

// maps from key to readable string
export const suggestionStatesReadable: { [key: string]: string } = {
  created: 'Created',
  pending: 'Pending',
  rejected: 'Rejected',
  actionable: 'Actionable',
  accepted: 'Accepted'
};

export enum SuggestionState {
  Created = 'created',
  Pending = 'pending',
  Rejected = 'rejected',
  Actionable = 'actionable',
  Accepted = 'accepted'
}

export const getListsString = (List: string[]): string => _.join(List, ', ');

export const getAvailableStatesString = (): string => getListsString(Object.values(suggestionStatesReadable));

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
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      suggestion TEXT NOT NULL,
      state VARCHAR(255) NOT NULL
    );
    `
  );
};

// Get id and suggestion from a list of Suggestions
export const getSuggestionPrintout = async (suggestions: Suggestion[]): Promise<string> => {
  return suggestions.map((suggestion) => '**' + suggestion['id'] + '** | ' + suggestion['suggestion']).join('\n');
};

export const addSuggestion = async (
  authorId: string,
  authorUsername: string,
  suggestion: string,
  state: string = SuggestionState.Created
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

export const updateSuggestionState = async (ids: number[], state = SuggestionState.Pending): Promise<void> => {
  const db = await openDB();
  ids.map(async function (id) {
    await db.run(
      `
      UPDATE suggestions
      SET state = ?
      WHERE id = ?;
      `,
      [state, id]
    );
  });
};

export const getSuggestions = async (state: string | null): Promise<Suggestion[]> => {
  const db = await openDB();
  let res: Suggestion[];

  if (!state) {
    // no state specified, query for all suggestions
    res = await db.all('SELECT * FROM suggestions ORDER BY created_at DESC');
  } else if (!Object.values(SuggestionState).includes(state as SuggestionState)) {
    throw 'Invalid state.';
  } else {
    // query suggestions by state
    res = await db.all('SELECT * FROM suggestions WHERE state = ? ORDER BY created_at DESC', state);
  }

  return res;
};
