import { CacheType, Message } from 'discord.js';
import { Command } from '@sapphire/framework';

export class CodeyUserError {
  message: Message | Command.ChatInputInteraction<CacheType>;
  errorMessage: string;

  constructor(_message: Message | Command.ChatInputInteraction, _error: string) {
    this.message = _message;
    this.errorMessage = _error;
  }

  sendToUser = (): void => {
    this.message.reply(this.errorMessage);
  };
}
