import { container } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  ComponentType,
  EmbedBuilder,
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
  BlackjackAction,
  BlackjackHand,
  BlackjackStage,
  CardSuit,
  GameState,
  endGame,
  gamesByPlayerId,
  performGameAction,
  startGame,
} from '../../components/games/blackjack';
import { pluralize } from '../../utils/pluralize';
import { adjustBlackjackGameResult } from '../../components/games/blackjackLeaderboards';

// CodeyCoin constants
const DEFAULT_BET = 10;
const MIN_BET = 10;
const MAX_BET = 1000000;

// Game buttons: Hit, Stand, Quit
const hit = new ButtonBuilder()
  .setCustomId('hit')
  .setLabel('Hit')
  .setEmoji('🇭')
  .setStyle(ButtonStyle.Success);
const stand = new ButtonBuilder()
  .setCustomId('stand')
  .setLabel('Stand')
  .setEmoji('🇸')
  .setStyle(ButtonStyle.Secondary);
const quit = new ButtonBuilder()
  .setCustomId('quit')
  .setLabel('Quit')
  .setEmoji('🇶')
  .setStyle(ButtonStyle.Danger);
const optionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(hit, stand, quit);

// ----------------------------------- START OF UTILITY FUNCTIONS ---------------------------- //

// Ensure bet amount is within set limit
const validateBetAmount = (amount: number): string => {
  if (amount < MIN_BET) return `Too few coins! Minimum bet is ${MIN_BET} Codey coins.`;
  if (amount > MAX_BET) return `Too many coins! Maximum bet is ${MAX_BET} Codey coins.`;
  return '';
};

// Map from string representing a suit to the corresponding emoji
const getSuitEmoji = (suit: string): string => {
  switch (suit) {
    case CardSuit.SPADES:
      return '♤';
    case CardSuit.HEARTS:
      return '♡';
    case CardSuit.CLUBS:
      return '♧';
    case CardSuit.DIAMONDS:
      return '♢';
    default:
      return '';
  }
};

// Produce string representing current hand to display in embed
const getHandDisplayString = (hand: BlackjackHand): string => {
  const cards = hand.map((card) => `${card.text}${getSuitEmoji(card.suite)}`).join(' ');
  return `Hand: ${cards}`;
};

// Collect player's action and progress the game based on that reaction
const performActionFromReaction = async (
  reaction: ButtonInteraction,
  playerId: string,
): Promise<GameState | null> => {
  const action = reaction.customId;
  // Progress game according to action
  switch (action) {
    case 'hit': {
      return performGameAction(playerId, BlackjackAction.HIT);
    }
    case 'stand': {
      return performGameAction(playerId, BlackjackAction.STAND);
    }
    case 'quit': {
      return performGameAction(playerId, BlackjackAction.QUIT);
    }
    default: {
      return null;
    }
  }
};

// Calculate new CodeyCoin balance
const getBalanceChange = (game: GameState): number => {
  return game.amountWon - game.bet;
};

// Display different embed color depending on game state
const getEmbedColourFromGame = (game: GameState): keyof typeof Colors => {
  if (game.stage === BlackjackStage.DONE) {
    const balance = getBalanceChange(game);

    // Player lost coins
    if (balance < 0) {
      return 'Red';
    }
    // Player won coins
    if (balance > 0) {
      return 'Green';
    }
    // Player didn't lose any coins
    return 'Orange';
  }

  // Game in progress
  return 'Yellow';
};

// Retrieve game status at different states
const getDescriptionFromGame = async (game: GameState): Promise<string> => {
  const amountDiff = Math.abs(getBalanceChange(game));
  if (game.stage === BlackjackStage.DONE) {
    // Player surrendered
    if (game.surrendered) {
      return `You surrendered and lost **${amountDiff}** Codey ${pluralize(
        'coin',
        amountDiff,
      )} ${getEmojiByName('codey_sad')}.`;
    }
    // Player lost
    if (game.amountWon < game.bet) {
      return `You lost **${amountDiff}** Codey ${pluralize('coin', amountDiff)} ${getEmojiByName(
        'codey_sad',
      )}, better luck next time!`;
    }
    // Player won
    if (game.amountWon > game.bet) {
      return `You won **${amountDiff}** Codey ${pluralize('coin', amountDiff)} ${getEmojiByName(
        'codey_love',
      )}, keep your win streak going!`;
    }

    // Player tied with dealer
    return `Tied! You didn't win nor lose any Codey ${pluralize('coin', amountDiff)}, try again!`;
  }

  // Game instruction
  return 'Press 🇭 to hit, 🇸 to stand, or 🇶 to quit.';
};

// Display embed to play game
const getEmbedFromGame = async (game: GameState): Promise<EmbedBuilder> => {
  const embed = new EmbedBuilder().setTitle('Blackjack');

  embed.setColor(getEmbedColourFromGame(game));

  const description = await getDescriptionFromGame(game);
  embed.addFields([
    // Show bet amount and game description
    { name: `Bet: ${game.bet} ${getCoinEmoji()}`, value: description },
    // Show player and dealer value and hands
    {
      name: `Player: ${game.playerValue.join(' or ')}`,
      value: getHandDisplayString(game.playerCards),
    },
    {
      name: `Dealer: ${game.dealerValue.join(' or ')}`,
      value: getHandDisplayString(game.dealerCards),
    },
  ]);

  return embed;
};

// End the game
const closeGame = async (playerId: string, game: GameState) => {
  const balanceChange = getBalanceChange(game);
  adjustBlackjackGameResult(playerId, balanceChange);
  endGame(playerId);
  adjustCoinBalanceByUserId(playerId, balanceChange, UserCoinEvent.Blackjack);
};

// ----------------------------------- END OF UTILITY FUNCTIONS ---------------------------- //

const blackjackExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponse> => {
  const message = messageFromUser;
  // If there are no arguments, then resolve to the default bet amount; if there is only one argument and it is an
  // integer, then this is the bet amount; otherwise, reply that a valid bet amount must be entered
  const bet = args['bet'] === undefined ? DEFAULT_BET : <number>args['bet'];

  const author = getUserFromMessage(message).id;
  const channel = message.channelId;

  const validateRes = validateBetAmount(bet);
  // If validation function returns an error message, then send it
  if (validateRes !== '') {
    return validateRes;
  }

  // Check player balance and see if it can cover the bet amount
  const playerBalance = await getCoinBalanceByUserId(author);
  if (playerBalance! < bet) {
    return `You don't have enough coins to place that bet. ${getEmojiByName('codey_sad')}`;
  }

  if (transferTracker.transferringUsers.has(author)) {
    return `Please finish your current coin transfer before starting a game.`;
  }

  if (gamesByPlayerId.has(author)) {
    return `Please finish your current game before starting another one!`;
  }

  // Initialize the game
  let game = startGame(bet, author, channel);
  if (!game) {
    return 'Please finish your current game before starting another one!';
  }

  const embed = await getEmbedFromGame(game);
  // Show game initial state and setup reactions
  const msg = await message.reply({
    embeds: [embed],
    components: game?.stage != BlackjackStage.DONE ? [optionRow] : [],
    fetchReply: true,
  });

  // Keep handling player action until game is done
  while (game && game?.stage != BlackjackStage.DONE) {
    try {
      // Make sure no one else besides OG player can interact with the game
      const reactFilter = (reaction: ButtonInteraction) => reaction.user.id === author;

      // Collect first valid action from the player, with a time limit of 1 minute.
      const reactCollector = await msg.awaitMessageComponent({
        filter: reactFilter,
        componentType: ComponentType.Button,
        time: 60000,
      });

      // Wait for user action
      game = await performActionFromReaction(reactCollector, author);
      const updatedEmbed = await getEmbedFromGame(game!);

      // Return next game state
      await msg.edit({ embeds: [updatedEmbed] });
      await reactCollector.update({ components: [optionRow] });
    } catch (error) {
      if (error instanceof Error && error.message.includes('time')) {
        // If player has not acted within time limit, consider it as quitting the game
        game = performGameAction(author, BlackjackAction.QUIT);
        await msg.edit(
          "You didn't act within the time limit. Unfortunately, this counts as a quit. Please start another game!",
        );
        if (game) {
          game.stage = BlackjackStage.DONE;
        }
      } else {
        // Handling Unexpected Errors
        await msg.edit('An unexpected error occured. The game has been aborted.');

        closeGame(author, 0); // No change to balance
        return 'An unexpected error occured. The game has been aborted.';
      }
    }
  }

  if (game) {
    // Update game embed
    const finalEmbed = await getEmbedFromGame(game);
    await msg.edit({ embeds: [finalEmbed], components: [] });
    // End the game
    closeGame(author, game);
  }
};

export const blackjackCommandDetails: CodeyCommandDetails = {
  name: 'bj',
  aliases: ['blj', 'blackjack', '21'],
  description: 'Play a Blackjack game to win some Codey coins!',
  detailedDescription: `**Examples:**
\`${container.botPrefix}bj 100\`
\`${container.botPrefix}blj 100\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Playing blackjack game...',
  executeCommand: blackjackExecuteCommand,
  messageIfFailure: 'Could not play the game',
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
