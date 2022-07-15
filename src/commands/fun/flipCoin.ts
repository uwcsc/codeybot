import { Command, container } from '@sapphire/framework';

import { CodeyCommand, CodeyCommandDetails, CodeyCommandResponseType, SapphireMessageExecuteType, SapphireMessageResponse } from '../../codeyCommand';

const executeCommand: SapphireMessageExecuteType = (
  _client,
  _messageFromUser,
  _initialMessageFromBot
): Promise<SapphireMessageResponse> => {
  const onHeads = Math.random() < 0.5;
  const content = `The coin landed on **${onHeads ? 'heads' : 'tails'}**!`;
  return new Promise((resolve, _reject) => resolve(content));
};

const flipcoinCommandDetails: CodeyCommandDetails = {
  name: 'flipCoin',
  aliases: ['fc', 'flip', 'flip-coin', 'coin-flip', 'coinflip'],
  description: 'Flip a coin! In making decisions, if it is not great, at least it is fair!',
  detailedDescription: `**Examples:**
\`${container.botPrefix}flip-coin\`
\`${container.botPrefix}fc\`
\`${container.botPrefix}flip\`
\`${container.botPrefix}coin-flip\`
\`${container.botPrefix}coinflip\`
\`${container.botPrefix}flipcoin\``,

  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Flipping a coin...',
  executeCommand: executeCommand,
  messageIfFailure: 'Failed to flip a coin.',
  codeyCommandResponseType: CodeyCommandResponseType.STRING,

  options: [],
  subcommandDetails: {},
}

export class FunFlipCoinCommand extends CodeyCommand {
  details = flipcoinCommandDetails;
  
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: flipcoinCommandDetails.aliases,
      description: flipcoinCommandDetails.description,
      detailedDescription: flipcoinCommandDetails.detailedDescription,
    });
  }
}
