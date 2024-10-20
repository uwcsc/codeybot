import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  getUserFromMessage,
  SapphireAfterReplyType,
  SapphireMessageExecuteType,
  SapphireMessageResponseWithMetadata,
} from '../../codeyCommand';
import { getCoinBalanceByUserId } from '../../components/coin';
import { getCoinEmoji } from '../../components/emojis';
import { rpsGameTracker } from '../../components/games/rps';
import { User } from 'discord.js';

const rpsExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponseWithMetadata> => {
  /*
    executeCommand sends the initial RPS embed;
    the subsequent interactionHandlers handle the rest of the logic
  */
  const bet = (args['bet'] ?? 10) as number;
  const player2 = (args['player 2'] as User) ?? undefined;
  const balance1 = await getCoinBalanceByUserId(getUserFromMessage(messageFromUser).id);
  const balance2 = player2 ? await getCoinBalanceByUserId(player2.id) : bet + 1;
  if (bet > balance1) {
    return new SapphireMessageResponseWithMetadata(
      `You don't have enough ${getCoinEmoji()} to place that bet.`,
      {},
    );
  }
  if (bet > balance2) {
    return new SapphireMessageResponseWithMetadata(
      `${player2} doesn't have enough ${getCoinEmoji()} to take that bet.`,
      {},
    );
  }
  if (bet < 10) {
    return new SapphireMessageResponseWithMetadata(`Minimum bet is 10 ${getCoinEmoji()}.`, {});
  }

  // Prevents players from challenging themselves
  if (player2 && player2.id === getUserFromMessage(messageFromUser).id) {
    return new SapphireMessageResponseWithMetadata(`You can't duel yourself!`, {});
  }

  const game = await rpsGameTracker.startGame(
    bet,
    messageFromUser.channelId,
    getUserFromMessage(messageFromUser),
    player2,
  );

  if (player2) {
    return new SapphireMessageResponseWithMetadata(game.getDuelEmbed(), {
      gameId: game.id,
    });
  }

  // Return initial response
  return new SapphireMessageResponseWithMetadata(game.getGameEmbed(), {
    gameId: game.id,
  });
};

const rpsAfterMessageReply: SapphireAfterReplyType = async (result, sentMessage) => {
  if (typeof result.metadata.gameId === 'undefined') return;
  // Store the message which the game takes place in the game object
  rpsGameTracker.runFuncOnGame(<number>result.metadata.gameId, (game) => {
    game.gameMessage = sentMessage;
  });
};

export const rpsCommandDetails: CodeyCommandDetails = {
  name: 'rps',
  aliases: [],
  description: 'Play Rock, Paper, Scissors!',
  detailedDescription: `**Examples:**
\`${container.botPrefix}rps\`
\`${container.botPrefix}rps 10\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Setting up your RPS game...',
  executeCommand: rpsExecuteCommand,
  afterMessageReply: rpsAfterMessageReply,
  options: [
    {
      name: 'bet',
      description: 'How much to bet - default is 10.',
      type: CodeyCommandOptionType.INTEGER,
      required: false,
    },
    {
      name: 'player 2',
      description: 'Invite someone to duel you!',
      type: CodeyCommandOptionType.USER,
      required: false,
    },
  ],
  subcommandDetails: {},
};
