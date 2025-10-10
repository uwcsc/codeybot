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
  // Sanitize messages when retrieving them (handles legacy data)
  return rows.map((row) => sanitizeMessageContent(row.message_content));
};

export const collectUserMessages = async (
  client: Client,
  userId: string,
  guildId: string,
  username: string,
  sinceDate?: Date | null,
): Promise<number> => {
  const db = await openDB();
  let totalCollected = 0;

  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      logger.error(`Guild ${guildId} not found for message collection`);
      return 0;
    }

    // Determine cutoff date: use provided date, or default to 1 year ago
    const cutoffDate =
      sinceDate ||
      (() => {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return oneYearAgo;
      })();

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
        let foundOldMessage = false;

        while (hasMoreMessages && !foundOldMessage) {
          const options: { limit: number; before?: string } = { limit: 100 };
          if (lastMessageId) {
            options.before = lastMessageId;
          }

          const messages: Collection<string, Message> = await channel.messages.fetch(options);

          if (messages.size === 0) {
            hasMoreMessages = false;
            break;
          }

          // Filter messages from the specific user within the cutoff date
          const userMessages = messages.filter(
            (msg: Message) =>
              msg.author.id === userId &&
              msg.content &&
              msg.content.trim().length > 0 &&
              !msg.author.bot &&
              !msg.content.trim().startsWith('.') &&
              msg.createdAt >= cutoffDate, // Only messages after cutoff
          );

          // Check if we've gone past the cutoff date
          const oldestMessage = messages.last();
          if (oldestMessage && oldestMessage.createdAt < cutoffDate) {
            foundOldMessage = true;
          }

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
          if (lastMessage && messages.size === 100 && !foundOldMessage) {
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

    if (totalCollected > 0) {
      logger.info(
        `Collected ${totalCollected} messages for user ${username} (${userId}) in guild ${guildId}`,
      );
    }

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

export const generateMarkovPhrase = (messages: string[], maxLength = 50): string => {
  if (messages.length === 0) return "I don't have anything to say!";

  // Combine all messages into one large corpus with sentence boundary markers
  // This allows the chain to cross between different original messages
  const combinedText = messages.join(' <SENTENCE_END> ');
  const allWords = combinedText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (allWords.length < 3) return "I don't have enough words to work with!";

  // Build both trigram and bigram transitions for fallback
  const trigramTransitions: Map<string, string[]> = new Map();
  const bigramTransitions: Map<string, string[]> = new Map();
  const trigramStarters: string[] = [];
  const bigramStarters: string[] = [];

  // Build trigram data
  if (allWords.length >= 3) {
    for (let i = 0; i < allWords.length - 2; i++) {
      const currentTriplet = `${allWords[i]} ${allWords[i + 1]} ${allWords[i + 2]}`;

      // Skip triplets that contain sentence boundaries for starters
      if (!currentTriplet.includes('<SENTENCE_END>')) {
        trigramStarters.push(currentTriplet);
      }

      // Build transitions (including across sentence boundaries, but filter them out later)
      if (i < allWords.length - 3) {
        const nextWord = allWords[i + 3];

        if (!trigramTransitions.has(currentTriplet)) {
          trigramTransitions.set(currentTriplet, []);
        }
        trigramTransitions.get(currentTriplet)!.push(nextWord);
      }
    }
  }

  // Build bigram data as fallback
  for (let i = 0; i < allWords.length - 1; i++) {
    const currentPair = `${allWords[i]} ${allWords[i + 1]}`;

    // Skip pairs that contain sentence boundaries for starters
    if (!currentPair.includes('<SENTENCE_END>')) {
      bigramStarters.push(currentPair);
    }

    // Build transitions
    if (i < allWords.length - 2) {
      const nextWord = allWords[i + 2];

      if (!bigramTransitions.has(currentPair)) {
        bigramTransitions.set(currentPair, []);
      }
      bigramTransitions.get(currentPair)!.push(nextWord);
    }
  }

  // Prefer trigrams but fallback to bigrams if needed
  const usesTrigrams = trigramStarters.length > 0;
  const transitions = usesTrigrams ? trigramTransitions : bigramTransitions;
  const starters = usesTrigrams ? trigramStarters : bigramStarters;
  const contextSize = usesTrigrams ? 3 : 2;

  if (starters.length === 0) return "I don't have anything to say!";

  // Generate phrase
  const result: string[] = [];
  let currentContext = starters[Math.floor(Math.random() * starters.length)];
  const startWords = currentContext.split(' ');
  result.push(...startWords);

  let iterations = 0;
  const maxIterations = Math.min(maxLength - contextSize, 40);

  while (iterations < maxIterations) {
    let possibleNext = transitions.get(currentContext);

    // Fallback to bigrams if trigram fails
    if (usesTrigrams && (!possibleNext || possibleNext.length === 0)) {
      const bigramContext = result.slice(-2).join(' ');
      possibleNext = bigramTransitions.get(bigramContext);
    }

    if (!possibleNext || possibleNext.length === 0) break;

    // Filter out sentence boundary markers and select next word
    const validNext = possibleNext.filter((word) => word !== '<SENTENCE_END>');

    // If we hit a sentence boundary, we have a chance to either:
    // 1. End the current phrase (30% chance)
    // 2. Jump to a new random context (20% chance)
    // 3. Continue with current context (50% chance)
    if (validNext.length === 0 || possibleNext.includes('<SENTENCE_END>')) {
      const rand = Math.random();
      if (rand < 0.3 && result.length >= 8) {
        // End phrase naturally
        break;
      } else if (rand < 0.5 && result.length >= 5) {
        // Jump to new context to mix things up
        const newContext = starters[Math.floor(Math.random() * starters.length)];
        const newWords = newContext.split(' ').slice(-contextSize);

        // Only add words that aren't already at the end to avoid repetition
        const lastWords = result.slice(-contextSize);
        if (newWords.join(' ') !== lastWords.join(' ')) {
          result.push(...newWords);
          currentContext = newWords.join(' ');
        }
        iterations++;
        continue;
      }
      // Otherwise try to continue with available valid words
      if (validNext.length === 0) break;
    }

    const nextWord =
      validNext.length > 0
        ? validNext[Math.floor(Math.random() * validNext.length)]
        : possibleNext[Math.floor(Math.random() * possibleNext.length)];

    if (nextWord === '<SENTENCE_END>') break;

    result.push(nextWord);

    // Update current context (slide the window)
    const lastWords = result.slice(-contextSize);
    currentContext = lastWords.join(' ');

    // Stop at natural sentence endings (but ensure minimum length)
    if (nextWord.match(/[.!?]$/) && result.length >= 8) break;

    // Better connector handling - only stop if we're at a natural pause
    if (result.length > 12) {
      // Check if this is a sentence starter that would indicate a new thought
      if (
        nextWord.match(
          /^(But|However|Therefore|Meanwhile|Additionally|Furthermore|Moreover|Nevertheless|Nonetheless)$/i,
        )
      ) {
        // Look ahead to see if we can complete the current thought
        const nextContext = usesTrigrams
          ? `${result.slice(-2).join(' ')} ${nextWord}`
          : `${result.slice(-1)[0]} ${nextWord}`;

        const lookahead = usesTrigrams
          ? trigramTransitions.get(nextContext)
          : bigramTransitions.get(nextContext);

        // If there's no good continuation after the connector, stop before it
        if (!lookahead || lookahead.length === 0) {
          result.pop(); // Remove the connector
          break;
        }
      }

      // Stop at coordinating conjunctions only if phrase is getting very long
      if (result.length > 20 && nextWord.match(/^(And|Or|So|Then|Now|Well)$/i)) {
        result.pop(); // Remove the connector
        break;
      }
    }

    iterations++;
  }

  // Clean up the result array to remove any sentence boundary markers that might have slipped through
  const cleanedResult = result.filter((word) => word !== '<SENTENCE_END>');

  // Ensure we have a reasonable ending
  let finalPhrase = cleanedResult.join(' ');

  // Remove trailing connectors that make the phrase feel incomplete
  const words = finalPhrase.split(' ');
  while (
    words.length > 3 &&
    words[words.length - 1].match(/^(and|or|but|so|then|now|well|also|too|though|yet|however)$/i)
  ) {
    words.pop();
    finalPhrase = words.join(' ');
  }

  // If phrase ends abruptly, try to find a better ending point
  if (!finalPhrase.match(/[.!?]$/) && words.length > 3) {
    // Look for the last reasonable stopping point (punctuation or common endings)
    for (let i = words.length - 1; i >= Math.max(3, words.length - 5); i--) {
      const word = words[i];
      if (
        word.match(/[.!?]$/) ||
        word.match(/^(too|though|yet|now|then|here|there|well|right|okay|ok)$/i)
      ) {
        finalPhrase = words.slice(0, i + 1).join(' ');
        break;
      }
    }
  }

  // Add punctuation if still missing
  if (!finalPhrase.match(/[.!?]$/)) {
    // Add appropriate punctuation based on content
    if (
      finalPhrase.toLowerCase().includes('what') ||
      finalPhrase.toLowerCase().includes('how') ||
      finalPhrase.toLowerCase().includes('why') ||
      finalPhrase.toLowerCase().includes('when') ||
      finalPhrase.toLowerCase().includes('where')
    ) {
      finalPhrase += '?';
    } else if (finalPhrase.match(/wow|great|awesome|amazing|cool|nice/i)) {
      finalPhrase += '!';
    } else {
      finalPhrase += '.';
    }
  }

  return finalPhrase;
};

// Daily sync function to update all users' message data
export const performDailyMessageSync = async (client: Client): Promise<void> => {
  const db = await openDB();

  try {
    logger.info('Starting daily message sync for all phrase users');

    // Get all opted-in users
    const users = await db.all(
      'SELECT user_id, guild_id, username, last_message_sync FROM phrase_users',
    );

    let totalUsersProcessed = 0;
    let totalMessagesCollected = 0;

    for (const user of users) {
      try {
        const lastSync = user.last_message_sync ? new Date(user.last_message_sync) : null;
        const guild = client.guilds.cache.get(user.guild_id);

        if (!guild) {
          logger.warn(`Guild ${user.guild_id} not found for user ${user.username}`);
          continue;
        }

        // Collect new messages since last sync using the unified function
        const messagesCollected = await collectUserMessages(
          client,
          user.user_id,
          user.guild_id,
          user.username,
          lastSync,
        );

        totalMessagesCollected += messagesCollected;
        totalUsersProcessed++;

        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Error syncing messages for user ${user.username}:`, error);
      }
    }

    logger.info(
      `Daily sync complete: processed ${totalUsersProcessed} users, collected ${totalMessagesCollected} messages`,
    );
  } catch (error) {
    logger.error('Error in daily message sync:', error);
  }
};

// Monthly cleanup function to remove messages older than 1 year
export const performMonthlyCleanup = async (): Promise<void> => {
  const db = await openDB();

  try {
    logger.info('Starting monthly message cleanup');

    // Calculate cutoff date (1 year ago)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Delete old messages
    const result = await db.run(
      'DELETE FROM phrase_messages WHERE message_timestamp < ?',
      oneYearAgo.toISOString(),
    );

    logger.info(`Monthly cleanup complete: removed ${result.changes} old messages`);
  } catch (error) {
    logger.error('Error in monthly cleanup:', error);
  }
};
