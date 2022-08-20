import { Command, container } from '@sapphire/framework';
import {
  CodeyCommand,
  CodeyCommandDetails,
  CodeyCommandOptionType,
  CodeyCommandResponseType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

const getRandomInt = (max: number): number => {
  return Math.floor(Math.random() * max) + 1;
};

const executeCommand: SapphireMessageExecuteType = (
  _client,
  _messageFromUser,
  args,
  _initialMessageFromBot,
): Promise<SapphireMessageResponse> => {
  const SIDES_LOWER_BOUND = 0;
  const SIDES_UPPER_BOUND = 1000000;
  const sides = <number>args!['sides'];

  if (sides <= SIDES_LOWER_BOUND) {
    return new Promise((resolve, _reject) => resolve(`I cannot compute ${sides} sides!`));
  }
  if (sides > SIDES_UPPER_BOUND) {
    return new Promise((resolve, _reject) => resolve("that's too many sides!"));
  }
  const diceFace = getRandomInt(sides);
  return new Promise((resolve, _reject) => resolve(`you rolled a ${diceFace}!`));
};

const rollDiceCommandDetails: CodeyCommandDetails = {
  name: 'rolldice',
  aliases: ['rd', 'roll', 'roll-dice', 'dice-roll', 'diceroll', 'dice'],
  description: 'Roll a dice!',
  detailedDescription: `**Examples:**
\`${container.botPrefix}roll-dice 6\`
\`${container.botPrefix}dice-roll 30\`
\`${container.botPrefix}roll 100\`
\`${container.botPrefix}rd 4\`
\`${container.botPrefix}diceroll 2\`
\`${container.botPrefix}dice 1\`
\`${container.botPrefix}rolldice 10\``,

  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Rolling a die...',
  executeCommand: executeCommand,
  messageIfFailure: 'Failed to roll a dice.',
  codeyCommandResponseType: CodeyCommandResponseType.STRING,

  options: [
    {
      name: 'sides',
      description: 'The number of sides on the dice',
      required: true,
      type: CodeyCommandOptionType.INTEGER,
    },
  ],
  subcommandDetails: {},
};

export class FunRollDiceCommand extends CodeyCommand {
  details = rollDiceCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: rollDiceCommandDetails.aliases,
      description: rollDiceCommandDetails.description,
      detailedDescription: rollDiceCommandDetails.detailedDescription,
    });
  }
}
