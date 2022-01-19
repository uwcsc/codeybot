import { Message } from 'discord.js';
import Commando, { CommandoMessage, CommandoClient, CommandInfo, ArgumentCollectorResult } from 'discord.js-commando';
import logger, { logError } from '../components/logger';

export abstract class BaseCommand extends Commando.Command {
  constructor(client: CommandoClient, info: CommandInfo) {
    info.autoAliases = false;
    if (info.examples) {
      info.examples = info.examples.map((ex) => `\`${ex}\``);
    }
    super(client, info);
  }

  run(
    message: CommandoMessage,
    // eslint-disable-next-line @typescript-eslint/ban-types
    args: object | string | string[],
    fromPattern: boolean,
    result?: ArgumentCollectorResult
  ): Promise<Message | Message[] | null> {
    // log each incoming command
    onCommandRun(message);
    return this.onRun(message, args, fromPattern, result);
  }

  onError(
    err: Error,
    message: CommandoMessage,
    _args: unknown,
    _fromPattern: boolean,
    _result?: ArgumentCollectorResult
  ): Promise<Message> {
    return handleCommandError(err, message);
  }

  abstract onRun(
    message: CommandoMessage,
    // eslint-disable-next-line @typescript-eslint/ban-types
    args: object | string | string[],
    fromPattern: boolean,
    result?: ArgumentCollectorResult
  ): Promise<Message | Message[] | null>;
}

export abstract class AdminCommand extends BaseCommand {
  constructor(client: CommandoClient, info: CommandInfo) {
    super(client, {
      ...info,
      userPermissions: [...(info.userPermissions || []), 'ADMINISTRATOR'],
      guildOnly: true // if this was set to false, users can issue Admin commands through DMs with Codey
    });
  }
}

export abstract class MentorCommand extends BaseCommand {
  constructor(client: CommandoClient, info: CommandInfo) {
    super(client, {
      ...info,
      userPermissions: [...(info.userPermissions || []), 'MOVE_MEMBERS']
    });
  }
}

const getMessageLogData = (message: CommandoMessage): { [key: string]: string } => {
  return {
    authorId: message.author.id,
    authorUsername: message.author.username,
    messageStr: message.toString(),
    command: message.command?.name || '',
    channel: message.channel.id,
    channelType: message.channel.type
  };
};

const handleCommandError = (err: Error, message: CommandoMessage): Promise<Message> => {
  logError(err, 'command', getMessageLogData(message));
  return message.reply('oops something went wrong, please contact a mod for help!');
};

const onCommandRun = (message: CommandoMessage): void => {
  logger.info({
    event: 'command',
    ...getMessageLogData(message)
  });
};
