import { Command, container } from '@sapphire/framework';

import { CodeyCommand, SapphireMessageExecuteType, SapphireMessageResponse } from '../../codeyCommand';

const commandOptions: Command.Options = {
  aliases: ['fc', 'flip', 'flip-coin', 'coin-flip', 'coinflip'],
  description: 'Flip a coin! In making decisions, if it is not great, at least it is fair!',
  detailedDescription: `**Examples:**
\`${container.botPrefix}flip-coin\`
\`${container.botPrefix}fc\`
\`${container.botPrefix}flip\`
\`${container.botPrefix}coin-flip\`
\`${container.botPrefix}coinflip\`
\`${container.botPrefix}flipcoin\``
};

const executeCommand: SapphireMessageExecuteType = (
  _client,
  _messageFromUser,
  _initialMessageFromBot
): SapphireMessageResponse => {
  const onHeads = Math.random() < 0.5;
  return `The coin landed on **${onHeads ? 'heads' : 'tails'}**!`;
};

export class FunFlipCoinCommand extends CodeyCommand {
  messageWhenExecutingCommand = 'Flipping a coin...';
  executeCommand: SapphireMessageExecuteType = executeCommand;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      ...commandOptions
    });
  }
}
