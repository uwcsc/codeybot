import {Database} from 'sqlite';
export const initUserProfileTable = async (db: Database): Promise<void> => {
    await db.run(
        `
        CREATE TABLE IF NOT EXISTS user_table (
            user_id VARCHAR(255) PRIMARY KEY NOT NULL,
            about_me TEXT, 
            birth_date TEXT,
            preferred_name VARCHAR(32),
            preferred_pronouns VARCHAR(16),
            term VARCHAR(2),
            year INTEGER,
            last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            major VARCHAR(16),
            program VARCHAR(32)
        );
        `
    )
}