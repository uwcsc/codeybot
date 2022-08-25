import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  getUserFromMessage,
  SapphireMessageExecuteType,
} from '../../codeyCommand';
import { RpsGameSign, startGame } from '../../components/games/rps';

const rpsExecuteCommand: SapphireMessageExecuteType = async (client, messageFromUser, args) => {
  const bet = (args['bet'] ?? 10) as number;
  const game = await startGame(
    bet,
    getUserFromMessage(messageFromUser).id,
    messageFromUser.channelId,
  );
  game.runGame(RpsGameSign.Rock, RpsGameSign.Scissors);
  return 'rps';
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
