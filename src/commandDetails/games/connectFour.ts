import { container } from '@sapphire/framework';
import { User } from 'discord.js';
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
import { connectFourGameTracker } from '../../components/games/connectFour';

const connectFourExecuteCommand: SapphireMessageExecuteType = async (
  _client,
  messageFromUser,
  args,
): Promise<SapphireMessageResponseWithMetadata> => {
  /*
    executeCommand sends the initial connectFour embed;
    the subsequent interactionHandlers handle the rest of the logic
  */
  // The user can challenge another user in the server
  // once we get that user's id we get the User object
  const challenger = args['challenger'] as User;
  console.log(challenger);
  // const challengerUser = getUserFromId(challenger);
  // const balance = await getCoinBalanceByUserId(getUserFromMessage(messageFromUser).id);
  // if (bet > balance) {
  //   return new SapphireMessageResponseWithMetadata(
  //     `You don't have enough ${getCoinEmoji()} to place that bet.`,
  //     {},
  //   );
  // }
  // if (bet < 10) {
  //   return new SapphireMessageResponseWithMetadata(`Minimum bet is 10 ${getCoinEmoji()}.`, {});
  // }

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
    console.log('!!!!!!!! ' + sentMessage);
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
  options: [
    {
      name: 'challenger',
      description: 'Challenge someone to a game of Connect 4.',
      type: CodeyCommandOptionType.USER,
      required: false,
    },
  ],
  subcommandDetails: {},
};
