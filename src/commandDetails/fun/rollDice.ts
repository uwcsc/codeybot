import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  CodeyCommandOptionType,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';
import { getRandomIntFrom1 } from '../../utils/num';

const rollDiceExecuteCommand: SapphireMessageExecuteType = (
  _client,
  _messageFromUser,
  args,
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
  const diceFace = getRandomIntFrom1(sides);
  return new Promise((resolve, _reject) => resolve(`you rolled a ${diceFace}!`));
};

export const rollDiceCommandDetails: CodeyCommandDetails = {
  name: 'rolldice',
  aliases: ['rd', 'roll', 'roll-dice', 'dice-roll', 'diceroll', 'dice'],
  description: 'Roll a dice! :game_die:',
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
  executeCommand: rollDiceExecuteCommand,
  messageIfFailure: 'Failed to roll a die.',
  options: [
    {
      name: 'sides',
      description: 'The number of sides on the die.',
      required: true,
      type: CodeyCommandOptionType.INTEGER,
    },
  ],
  subcommandDetails: {},
};
