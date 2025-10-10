import { EventEmitter } from 'events';
import { Client, TextChannel } from 'discord.js';
import * as reminderComponents from './reminder';
import * as announcementComponents from './announcement';
import config from '../../../config/staging/vars.json';

export class ReminderObserver extends EventEmitter {
  private client: Client;
  private globalCheckInterval: NodeJS.Timeout | null = null;

  constructor(client: Client) {
    super();
    this.client = client;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.on('reminderDue', async (reminder) => {
      await this.sendReminder(reminder);
      await reminderComponents.markReminderAsSent(reminder.id);
    });

    this.on('announcementDue', async (announcement) => {
      await this.sendAnnouncement(announcement);
      await announcementComponents.markAnnouncementAsSent(announcement.id);
    });
  }

  async start(): Promise<void> {
    this.globalCheckInterval = setInterval(async () => {
      await this.checkForDueReminders();
      await this.checkForDueAnnouncements();
    }, 60 * 1000);
    await this.checkForDueReminders();
    await this.checkForDueAnnouncements();
  }

  private async checkForDueReminders() {
    try {
      const dueReminders = await reminderComponents.getDueReminders();
      if (dueReminders.length > 0) {
        dueReminders.forEach((reminder: reminderComponents.Reminder) => {
          this.emit('reminderDue', reminder);
        });
      }
    } catch (error) {
      // Error in checking for due reminders
    }
  }
  private async checkForDueAnnouncements() {
    try {
      const dueReminders = await announcementComponents.getDueAnnouncements();
      if (dueReminders.length > 0) {
        dueReminders.forEach((reminder: reminderComponents.Reminder) => {
          this.emit('announcementDue', reminder);
        });
      }
    } catch (error) {
      // Error finding announcement
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async sendReminder(reminder: any) {
    try {
      const user = await this.client.users.fetch(reminder.user_id);
      if (user) {
        await user.send({
          embeds: [
            {
              title: reminder.is_reminder ? 'Reminder!' : 'Timer',
              description: reminder.message,
              color: 0x00ff00,
              timestamp: new Date().toISOString(),
              footer: {
                text: `Set on ${new Date(reminder.created_at).toLocaleDateString()}`,
              },
            },
          ],
        });
      }
    } catch (error) {
      // Error in send reminder
    }
  }

  private async sendAnnouncement(announcement: announcementComponents.Announcement) {
    try {
      const guild = this.client.guilds.cache.get(config.TARGET_GUILD_ID);
      if (!guild) {
        return;
      }

      // Get the announcements channel using its ID from config
      const channel = guild.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID) as TextChannel;
      if (!channel) {
        return;
      }

      await channel.send({
        content: announcement.message,
        files: announcement.image_url ? [announcement.image_url] : [],
      });
    } catch (error) {}
  }
}
