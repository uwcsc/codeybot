import { Command } from '@sapphire/framework';
import { CodeyCommand } from '../../codeyCommand'
import { announcementCommandDetails } from '../../commandDetails/reminder/announcements';

export class AnnouncementCommand extends CodeyCommand {
  details = announcementCommandDetails;

  public constructor(context: Command.Context, options: Command.Options) {
    super(context, {
      ...options,
      aliases: announcementCommandDetails.aliases,
      description: announcementCommandDetails.description,
      detailedDescription: announcementCommandDetails.detailedDescription,
    });
  }
}
