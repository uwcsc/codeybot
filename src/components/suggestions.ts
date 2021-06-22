import { Database } from 'sqlite';

import { openDB } from './db';

// All states of suggestion records
export enum SuggestionStates {
  Created = 1,
  Rejected,
  Pending,
  Accepted
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
      state INTEGER NOT NULL
    );
    `
  );
};

export const addSuggestion = async (
  authorId: string,
  authorUsername: string,
  suggestion: string,
  state: SuggestionStates = SuggestionStates.Created
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
