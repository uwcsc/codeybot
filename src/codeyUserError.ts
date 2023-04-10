import { CacheType, Message } from 'discord.js';
import { Command } from '@sapphire/framework';

export class CodeyUserError {
  message: Message | Command.ChatInputCommandInteraction<CacheType> | undefined;
  errorMessage: string;

  constructor(_message: Message | Command.ChatInputCommandInteraction | undefined, _error: string) {
    this.message = _message;
    this.errorMessage = _error;
  }

  sendToUser = (): void => {
    if (this.message) {
      this.message.reply(this.errorMessage);
    }
  };
}
