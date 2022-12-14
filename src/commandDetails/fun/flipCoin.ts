import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

const flipCoinExecuteCommand: SapphireMessageExecuteType = (
  _client,
  _messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  const onHeads = Math.random() < 0.5;
  const content = `The coin landed on **${onHeads ? 'heads' : 'tails'}**!`;
  return new Promise((resolve, _reject) => resolve(content));
};

export const flipCoinCommandDetails: CodeyCommandDetails = {
  name: 'flipcoin',
  aliases: ['fc', 'flip', 'flip-coin', 'coin-flip', 'coinflip'],
  description:
    'Flip a coin! :coin: In making decisions, if it is not great, at least it is fair! :scales:',
  detailedDescription: `**Examples:**
  \`${container.botPrefix}flip-coin\`
  \`${container.botPrefix}fc\`
  \`${container.botPrefix}flip\`
  \`${container.botPrefix}coin-flip\`
  \`${container.botPrefix}coinflip\`
  \`${container.botPrefix}flipcoin\``,

  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Flipping a coin...',
  executeCommand: flipCoinExecuteCommand,
  messageIfFailure: 'Failed to flip a coin.',
  options: [],
  subcommandDetails: {},
};
