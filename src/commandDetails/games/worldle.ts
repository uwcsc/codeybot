import { container } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
  getUserFromMessage,
} from '../../codeyCommand';
import {
  UserCoinEvent,
  adjustCoinBalanceByUserId,
  getCoinBalanceByUserId,
  transferTracker,
} from '../../components/coin';
import { getCoinEmoji, getEmojiByName } from '../../components/emojis';
import {
  WorldleAction,
  WorldleGame,
  endWorldleGame,
  fetchCountries,
  getProgressBar,
  performWorldleAction,
  startWorldleGame,
  worldleGamesByPlayerId,
} from '../../components/games/worldle';

// CodeyCoin constants
const DEFAULT_BET = 20;
const MIN_BET = 10;
const MAX_BET = 1000000;
const REWARD_PER_GUESS = 10; // Additional reward for each unused guess

// ----------------------------------- START OF UTILITY FUNCTIONS ---------------------------- //

// ensure bet is within bounds
const validateBetAmount = (amount: number): string => {
  if (amount < MIN_BET) return `Too few coins! Minimum bet is ${MIN_BET} Codey coins.`;
  if (amount > MAX_BET) return `Too many coins! Maximum bet is ${MAX_BET} Codey coins.`;
  return '';
};

const createGameButtons = () => {
  const guessButton = new ButtonBuilder()
    .setCustomId('guess')
    .setLabel('Make a Guess')
    .setEmoji('🌍')
    .setStyle(ButtonStyle.Success);

  const hintButton = new ButtonBuilder()
    .setCustomId('hint')
    .setLabel('Hint')
    .setEmoji('💡')
    .setStyle(ButtonStyle.Primary);

  const quitButton = new ButtonBuilder()
    .setCustomId('quit')
    .setLabel('Quit')
    .setEmoji('🚪')
    .setStyle(ButtonStyle.Danger);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(guessButton, hintButton, quitButton);
};

const createGuessModal = (): {
  modal: ModalBuilder;
  actionRow: ActionRowBuilder<TextInputBuilder>;
} => {
  const modal = new ModalBuilder().setCustomId('worldle-guess').setTitle('Guess the Country');

  const countryInput = new TextInputBuilder()
    .setCustomId('country-input')
    .setLabel('Enter country name')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. France, Japan, Brazil')
    .setRequired(true);

  const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(countryInput);
  modal.addComponents(actionRow);

  return { modal, actionRow };
};

// create an embed for the game
const createGameEmbed = (game: WorldleGame, bet: number): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setTitle('Worldle - Guess the Country')
    .setColor(game.gameOver ? (game.won ? Colors.Green : Colors.Red) : Colors.Yellow);

  // add game description
  if (game.gameOver) {
    if (game.won) {
      const unusedGuesses = game.maxAttempts - game.guessedCountries.length;
      const extraReward = unusedGuesses * REWARD_PER_GUESS;
      embed.setDescription(
        `🎉 You won! The country was **${game.targetCountry.name}**.\n` +
          `You guessed it in ${game.guessedCountries.length}/${game.maxAttempts} attempts.\n` +
          `Reward: ${bet + extraReward} ${getCoinEmoji()} (+${extraReward} bonus for quick solve)`,
      );
    } else {
      embed.setDescription(
        `Game over! The country was **${game.targetCountry.name}**.\n` +
          `You lost ${bet} ${getCoinEmoji()}. Better luck next time!`,
      );
    }
  } else {
    embed.setDescription(
      `Guess the country silhouette! You have ${
        game.maxAttempts - game.guessedCountries.length
      } guesses left.\n` +
        `Bet: ${bet} ${getCoinEmoji()}\n` +
        `Use the buttons below to make a guess or get a hint.`,
    );
  }

  // add guesses
  if (game.guessedCountries.length > 0) {
    const guessesField = game.guessedCountries
      .map((guess, index) => {
        return `${index + 1}. **${guess.country.name}** - ${guess.distance} km ${
          guess.direction
        }\n${getProgressBar(guess.percentage)} ${guess.percentage}%`;
      })
      .join('\n\n');

    embed.addFields({ name: 'Your Guesses', value: guessesField });
  }

  return embed;
};

// game end handler
const handleGameEnd = async (game: WorldleGame, playerId: string, bet: number): Promise<number> => {
  let reward = 0;

  if (game.won) {
    // calc reward : base bet + unused guesses
    const unusedGuesses = game.maxAttempts - game.guessedCountries.length;
    reward = bet + unusedGuesses * REWARD_PER_GUESS;
  } else {
    // loses bet
    reward = -bet;
  }

  await adjustCoinBalanceByUserId(playerId, reward, UserCoinEvent.Worldle);

  // end game
  endWorldleGame(playerId);

  return reward;
};

// ----------------------------------- END OF UTILITY FUNCTIONS ---------------------------- //

const worldleExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const message = messageFromUser;

  const bet = args['bet'] === undefined ? DEFAULT_BET : <number>args['bet'];

  const author = getUserFromMessage(message).id;
  const channel = message.channelId;

  // validate bet
  const validateRes = validateBetAmount(bet);
  if (validateRes !== '') {
    return validateRes;
  }

  // check if user has enough coins to bet
  const playerBalance = await getCoinBalanceByUserId(author);
  if (playerBalance! < bet) {
    return `You don't have enough coins to place that bet. ${getEmojiByName('codey_sad')}`;
  }

  // check if user is transferring coins
  if (transferTracker.transferringUsers.has(author)) {
    return `Please finish your current coin transfer before starting a game.`;
  }

  // check if user has active game
  if (worldleGamesByPlayerId.has(author)) {
    // check if game is still running
    const currentGame = worldleGamesByPlayerId.get(author)!;
    const now = new Date().getTime();

    if (!currentGame.gameOver && now - currentGame.startedAt.getTime() < 60000) {
      return `Please finish your current game before starting another one!`;
    }
  }

  await fetchCountries();

  // initialize game
  const game = await startWorldleGame(author, channel);
  if (!game) {
    return 'Failed to start the game. Please try again later.';
  }

  const gameButtons = createGameButtons();

  // initial game state
  const msg = await message.reply({
    embeds: [createGameEmbed(game, bet)],
    components: [gameButtons],
    fetchReply: true,
  });

  const collector = msg.createMessageComponentCollector({
    filter: (i: Interaction) => {
      if (!i.isButton() && !i.isModalSubmit()) return false;
      return i.user.id === author;
    },
    time: 300000, // 5 min timeout
  });

  const modalHandler = async (interaction: Interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== 'worldle-guess') return;
    if (interaction.user.id !== author) return;

    try {
      const countryName = interaction.fields.getTextInputValue('country-input');

      // Process the guess
      const result = performWorldleAction(author, WorldleAction.GUESS, countryName);

      if (result.error) {
        await interaction.reply({
          content: result.error,
          ephemeral: true,
        });
      } else {
        await interaction.deferUpdate().catch(() => {
          // if refails, try reply
          return interaction.reply({
            content: `Guessed: ${countryName}`,
            ephemeral: true,
          });
        });

        // update original msg
        await msg.edit({
          embeds: [createGameEmbed(game, bet)],
          components: game.gameOver ? [] : [gameButtons],
        });

        // Handle game end if necessary
        if (game.gameOver) {
          await handleGameEnd(game, author, bet);
          collector.stop();
        }
      }
    } catch (error) {
      // Try to respond to the interaction in multiple ways to ensure at least one works
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'An error occurred while processing your guess.',
            ephemeral: true,
          });
        }
      } catch (replyError) {
        await msg.edit(`Error in processing your request.`);
      }
    }
  };

  _client.on('interactionCreate', modalHandler);

  // remove listener when done
  collector.on('end', () => {
    _client.off('interactionCreate', modalHandler);
  });

  collector.on('collect', async (interaction: ButtonInteraction) => {
    if (!interaction.isButton()) return;

    try {
      if (interaction.customId === 'guess') {
        const { modal } = createGuessModal();
        await interaction.showModal(modal);
      } else if (interaction.customId === 'hint') {
        // retrieve hint
        const hintResult = performWorldleAction(author, WorldleAction.HINT);
        if (hintResult) {
          await interaction.reply({
            content: `**Hint ${hintResult.hintNumber}/${game.maxAttempts}**: ${hintResult.hint}`,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: 'No hints available.',
            ephemeral: true,
          });
        }
      } else if (interaction.customId === 'quit') {
        performWorldleAction(author, WorldleAction.QUIT);
        game.gameOver = true;

        await handleGameEnd(game, author, bet);

        await interaction.update({
          embeds: [createGameEmbed(game, bet)],
          components: [],
        });

        collector.stop();
      }
    } catch (error) {
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'An error occurred while processing your action.',
            ephemeral: true,
          });
        }
      } catch (replyError) {
        await msg.edit('Error in processing your request');
      }
    }
  });

  return undefined; // message already sent
};

export const worldleCommandDetails: CodeyCommandDetails = {
  name: 'worldle',
  aliases: ['wl', 'country-guess'],
  description: 'Play Worldle - Guess the country',
  detailedDescription: `**Examples:**
\`${container.botPrefix}worldle\`
\`${container.botPrefix}worldle 100\`
\`${container.botPrefix}wl 50\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Starting Worldle game...',
  executeCommand: worldleExecuteCommand,
  messageIfFailure: 'Could not start the Worldle game',
  options: [
    {
      name: 'bet',
      description: 'A valid bet amount',
      type: CodeyCommandOptionType.INTEGER,
      required: false,
    },
  ],
  subcommandDetails: {},
};
