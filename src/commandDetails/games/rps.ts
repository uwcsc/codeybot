import { container } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  getUserFromMessage,
  SapphireMessageExecuteType,
} from '../../codeyCommand';
import { getCoinEmoji, getEmojiByName } from '../../components/emojis';
import { RpsGameSign, RpsGameStatus, startGame } from '../../components/games/rps';

const rpsExecuteCommand: SapphireMessageExecuteType = async (_client, messageFromUser, args) => {
  /* 
    executeCommand sends the initial RPS embed; 
    the subsequent interactionHandlers handle the rest of the logic
  */
  const bet = (args['bet'] ?? 10) as number;
  const game = await startGame(
    bet,
    messageFromUser.channelId,
    getUserFromMessage(messageFromUser),
    undefined, // We should change this when we implement 2 players
  );

  // Return initial response
  return game.getGameResponse();
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
  options: [
    {
      name: 'bet',
      description: 'How much to bet - default is 10',
      type: CodeyCommandOptionType.INTEGER,
      required: false,
    },
  ],
  subcommandDetails: {},
};
