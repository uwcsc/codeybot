import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  getUserFromMessage,
  SapphireAfterReplyType,
  SapphireMessageExecuteType,
  SapphireMessageResponseWithMetadata,
} from '../../codeyCommand';
import { connectFourGameTracker } from '../../components/games/connectFour';

const connectFourExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  _args,
): Promise<SapphireMessageResponseWithMetadata> => {
  /*
    executeCommand sends the initial connectFour embed;
    the subsequent interactionHandlers handle the rest of the logic
  */

  const game = await connectFourGameTracker.startGame(
    messageFromUser.channelId,
    getUserFromMessage(messageFromUser),
  );

  // Return initial response
  return new SapphireMessageResponseWithMetadata(game.getGameResponse(), {
    gameId: game.id,
  });
};

const connectFourAfterMessageReply: SapphireAfterReplyType = async (result, sentMessage) => {
  if (typeof result.metadata.gameId === 'undefined') return;
  // Store the message which the game takes place in the game object
  connectFourGameTracker.runFuncOnGame(<number>result.metadata.gameId, (game) => {
    game.gameMessage = sentMessage;
  });
};

export const connectFourCommandDetails: CodeyCommandDetails = {
  name: 'connect4',
  aliases: [],
  description: 'Play Connect 4!',
  detailedDescription: `**Examples:**
\`${container.botPrefix}connect4\`
\`${container.botPrefix}connect 4 @user\``,

  isCommandResponseEphemeral: false,
  messageWhenExecutingCommand: 'Setting up your Connect 4 game...',
  executeCommand: connectFourExecuteCommand,
  afterMessageReply: connectFourAfterMessageReply,
  options: [],
  subcommandDetails: {},
};
