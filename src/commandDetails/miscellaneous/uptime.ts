import { container } from '@sapphire/framework';
import {
  CodeyCommandDetails,
  SapphireMessageExecuteType,
  SapphireMessageResponse,
} from '../../codeyCommand';

const uptimeExecuteCommand: SapphireMessageExecuteType = (
  client,
  _messageFromUser,
  _args,
): Promise<SapphireMessageResponse> => {
  // In the case where client.uptime is null we return 0
  let totalSeconds = (client.uptime ? client.uptime : 0) / 1000;
  const days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const uptime = `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
  const content = `Uptime is **${uptime}**.`;
  return new Promise((resolve, _reject) => resolve(content));
};

export const uptimeCommandDetails: CodeyCommandDetails = {
  name: 'uptime',
  aliases: ['up', 'timeup'],
  description: "Get Codey's uptime!",
  detailedDescription: `**Examples:**
  \`${container.botPrefix}uptime\`
  \`${container.botPrefix}up\`
  \`${container.botPrefix}timeup\``,

  isCommandResponseEphemeral: true,
  messageWhenExecutingCommand: 'Getting uptime...',
  executeCommand: uptimeExecuteCommand,
  messageIfFailure: "Failed to get Codey's uptime.",
  options: [],
  subcommandDetails: {},
};
