import { openDB } from './db';
import { Client, TextChannel, Collection, Message } from 'discord.js';
import { logger } from '../logger/default';

// Sanitize message content to remove mentions and other problematic content
const sanitizeMessageContent = (content: string): string => {
  return (
    content
      // Remove user mentions: <@123456789> or <@!123456789>
      .replace(/<@!?\d+>/g, '@user')
      // Remove role mentions: <@&123456789>
      .replace(/<@&\d+>/g, '@role')
      // Remove channel mentions: <#123456789>
      .replace(/<#\d+>/g, '#channel')
      // Remove custom emojis: <:name:123456789> or <a:name:123456789>
      .replace(/<a?:\w+:\d+>/g, ':emoji:')
      // Remove URLs to prevent link spam
      .replace(/https?:\/\/[^\s]+/g, '[link]')
      .trim()
  );
};

export const checkIfUserSignedUp = async (userId: string, guildId: string): Promise<boolean> => {
  const db = await openDB();
  const result = await db.get(
    'SELECT user_id FROM phrase_users WHERE user_id = ? AND guild_id = ?',
    userId,
    guildId,
  );
  return result !== undefined;
};

export const signUpUser = async (
  userId: string,
  guildId: string,
  username: string,
): Promise<void> => {
  const db = await openDB();
  await db.run(
    'INSERT INTO phrase_users (user_id, guild_id, username, opted_in_at, last_message_sync) VALUES (?, ?, ?, datetime("now"), NULL)',
    userId,
    guildId,
    username,
  );
};

export const removeUser = async (userId: string, guildId: string): Promise<void> => {
  const db = await openDB();
  await db.run('DELETE FROM phrase_users WHERE user_id = ? AND guild_id = ?', userId, guildId);
  // Note: phrase_messages will be automatically deleted due to ON DELETE CASCADE
};

export const getUserMessages = async (userId: string, guildId: string): Promise<string[]> => {
  const db = await openDB();
  const rows = await db.all(
    'SELECT message_content FROM phrase_messages WHERE user_id = ? AND guild_id = ? ORDER BY message_timestamp',
    userId,
    guildId,
  );
  return rows.map((row) => row.message_content);
};

export const collectUserMessages = async (
  client: Client,
  userId: string,
  guildId: string,
  username: string,
): Promise<number> => {
  const db = await openDB();
  let totalCollected = 0;

  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      logger.error(`Guild ${guildId} not found for message collection`);
      return 0;
    }

    // Get all text channels in the guild
    const textChannels = guild.channels.cache.filter(
      (channel) => channel.isTextBased() && channel.type === 0, // GUILD_TEXT
    ) as Collection<string, TextChannel>;

    for (const [, channel] of textChannels) {
      try {
        // Check if bot has permission to read message history
        const permissions = channel.permissionsFor(client.user!);
        if (!permissions?.has(['ViewChannel', 'ReadMessageHistory'])) {
          continue; // Skip channels we can't read
        }

        let lastMessageId: string | undefined;
        let hasMoreMessages = true;

        while (hasMoreMessages) {
          const options: { limit: number; before?: string } = { limit: 100 };
          if (lastMessageId) {
            options.before = lastMessageId;
          }

          const messages: Collection<string, Message> = await channel.messages.fetch(options);

          if (messages.size === 0) {
            hasMoreMessages = false;
            break;
          }

          // Filter messages from the specific user
          const userMessages = messages.filter(
            (msg: Message) =>
              msg.author.id === userId &&
              msg.content &&
              msg.content.trim().length > 0 &&
              !msg.author.bot &&
              !msg.content.trim().startsWith('.'),
          );

          // Insert messages into database
          for (const [, message] of userMessages) {
            try {
              // Sanitize message content before storing
              const sanitizedContent = sanitizeMessageContent(message.content);

              // Skip messages that become too short after sanitization
              if (sanitizedContent.length < 3) continue;

              await db.run(
                `INSERT OR IGNORE INTO phrase_messages 
                 (user_id, guild_id, message_content, channel_id, message_id, message_timestamp, collected_at) 
                 VALUES (?, ?, ?, ?, ?, ?, datetime("now"))`,
                userId,
                guildId,
                sanitizedContent,
                channel.id,
                message.id,
                new Date(message.createdTimestamp).toISOString(),
              );
              totalCollected++;
            } catch (insertError: unknown) {
              // Skip duplicate messages (INSERT OR IGNORE)
              if (
                insertError instanceof Error &&
                !insertError.message.includes('UNIQUE constraint failed')
              ) {
                logger.error('Error inserting message:', insertError);
              }
            }
          }

          // Set up for next iteration
          const lastMessage = messages.last();
          if (lastMessage && messages.size === 100) {
            lastMessageId = lastMessage.id;
          } else {
            hasMoreMessages = false;
          }

          // Add delay to respect rate limits
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (channelError) {
        logger.error(`Error collecting from channel ${channel.name}:`, channelError);
        // Continue with other channels
      }
    }

    // Update last_message_sync timestamp
    await db.run(
      'UPDATE phrase_users SET last_message_sync = datetime("now") WHERE user_id = ? AND guild_id = ?',
      userId,
      guildId,
    );

    logger.info(
      `Collected ${totalCollected} messages for user ${username} (${userId}) in guild ${guildId}`,
    );
    return totalCollected;
  } catch (error) {
    logger.error('Error in collectUserMessages:', error);
    throw error;
  }
};

export const signUpUserWithCollection = async (
  client: Client,
  userId: string,
  guildId: string,
  username: string,
): Promise<{ success: boolean; messagesCollected?: number; error?: string }> => {
  try {
    // First sign up the user
    await signUpUser(userId, guildId, username);

    // Then collect their messages with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Message collection timeout')), 300000); // 5 minutes
    });

    const collectionPromise = collectUserMessages(client, userId, guildId, username);

    const messagesCollected = await Promise.race([collectionPromise, timeoutPromise]);

    return { success: true, messagesCollected };
  } catch (error) {
    logger.error('Error in signUpUserWithCollection:', error);

    // If signup succeeded but collection failed, user is still signed up
    const isSignedUp = await checkIfUserSignedUp(userId, guildId);
    if (isSignedUp) {
      if (error instanceof Error && error.message === 'Message collection timeout') {
        return {
          success: true,
          messagesCollected: 0,
          error:
            'Message collection timed out, but you are signed up. Messages will be collected in the next daily sync.',
        };
      }
      return {
        success: true,
        messagesCollected: 0,
        error:
          'Message collection failed, but you are signed up. Messages will be collected in the next daily sync.',
      };
    }

    return { success: false, error: 'Failed to sign up user.' };
  }
};

export const generateMarkovPhrase = (messages: string[], maxLength = 100): string => {
  if (messages.length === 0) return "I don't have anything to say!";

  // Build word transitions map
  const transitions: Map<string, string[]> = new Map();
  const starters: string[] = [];

  for (const message of messages) {
    const words = message
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    if (words.length === 0) continue;

    // Track sentence starters
    starters.push(words[0]);

    // Build transitions
    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i];
      const nextWord = words[i + 1];

      if (!transitions.has(currentWord)) {
        transitions.set(currentWord, []);
      }
      transitions.get(currentWord)!.push(nextWord);
    }
  }

  if (starters.length === 0) return "I don't have anything to say!";

  // Generate phrase
  const result: string[] = [];
  let currentWord = starters[Math.floor(Math.random() * starters.length)];
  result.push(currentWord);

  for (let i = 0; i < maxLength && transitions.has(currentWord); i++) {
    const possibleNext = transitions.get(currentWord)!;
    if (possibleNext.length === 0) break;

    currentWord = possibleNext[Math.floor(Math.random() * possibleNext.length)];
    result.push(currentWord);

    // Stop at sentence endings
    if (currentWord.match(/[.!?]$/)) break;
  }

  return result.join(' ');
};
