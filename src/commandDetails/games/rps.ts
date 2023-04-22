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
  const balance = await getCoinBalanceByUserId(getUserFromMessage(messageFromUser).id);
  if (bet > balance) {
    return new SapphireMessageResponseWithMetadata(
      `You don't have enough ${getCoinEmoji()} to place that bet.`,
      {},
    );
  }
  if (bet < 10) {
    return new SapphireMessageResponseWithMetadata(`Minimum bet is 10 ${getCoinEmoji()}.`, {});
  }

  const game = await rpsGameTracker.startGame(
    bet,
    messageFromUser.channelId,
    getUserFromMessage(messageFromUser),
    undefined, // We should change this when we implement 2 players
  );

  // Return initial response
  return new SapphireMessageResponseWithMetadata(game.getGameResponse(), {
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
  ],
  subcommandDetails: {},
};
