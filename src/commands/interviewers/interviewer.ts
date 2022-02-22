import { SubCommandPluginCommand } from '@sapphire/plugin-subcommands';
import type { Args } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { clearProfile, getInterviewer } from '../../components/interview';

// Extend `SubCommandPluginCommand` instead of `Command`
export class UserCommand extends SubCommandPluginCommand {
  public constructor(context: SubCommandPluginCommand.Context, options: SubCommandPluginCommand.Options) {
    super(context, {
      ...options,
      subCommands: ['clear', 'domain', 'pause', 'profile', 'resume', { input: 'list', default: true }, 'signup']
    });
  }

  public async clear(message: Message): Promise<Message> {
    const { id } = message.author;

    // check if user signed up to be interviewer
    if (!(await getInterviewer(id))) {
      return message.reply(
        `you don't seem to have signed up yet, please sign up using \`${this.container.client.fetchPrefix(
          message
        )}interviewer-signup <calendarUrl>\`!`
      );
    }

    // clear interviewer data
    await clearProfile(id);
    return message.reply('your interviewer profile has been cleared!');
  }
}
