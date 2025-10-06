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
      console.log(`🔔 Processing due reminder: ${reminder.message}`);
      await this.sendReminder(reminder);
      await reminderComponents.markReminderAsSent(reminder.id);
    });

    this.on('announcementDue', async (announcement) => {
      console.log(`📢 Processing due announcement: ${announcement.title}`);
      await this.sendAnnouncement(announcement);
      await announcementComponents.markAnnouncementAsSent(announcement.id);
    });
  }

  async start() {
    console.log('🔔 Reminder Observer started');
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
        console.log(`📬 Found ${dueReminders.length} due reminder(s)`);
        dueReminders.forEach((reminder: any) => {
          this.emit('reminderDue', reminder); // emits event for observers
        });
      }
    } catch (error) {
      console.error('Error checking due reminders:', error);
    }
  }
  private async checkForDueAnnouncements() {
    try {
      const dueReminders = await announcementComponents.getDueAnnouncements();
      if (dueReminders.length > 0) {
        console.log(`📬 Found ${dueReminders.length} due announcement(s)`);
        dueReminders.forEach((reminder: any) => {
          this.emit('announcementDue', reminder); // emits event for observers
        });
      }
    } catch (error) {
      console.error('Error checking due announcements:', error);
    }
  }

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
        console.log(`Sent reminder to ${user.username}: ${reminder.message}`);
      }
    } catch (error) {
      console.error(`Failed to send reminder to user ${reminder.user_id}:`, error);
    }
  }

  private async sendAnnouncement(announcement: any) {
    try {
      const guild = this.client.guilds.cache.get(config.TARGET_GUILD_ID);
      if (!guild) {
        console.error(`Could not find guild with ID ${config.TARGET_GUILD_ID}`);
        return;
      }

      // Get the announcements channel using its ID from config
      const channel = guild.channels.cache.get(config.ANNOUNCEMENTS_CHANNEL_ID) as TextChannel;
      if (!channel) {
        console.error(
          `Could not find announcements channel with ID ${config.ANNOUNCEMENTS_CHANNEL_ID}`,
        );
        return;
      }
      // Send the announcement with proper formatting
      await channel.send({
        content: announcement.message,
        files: announcement.image_url ? [announcement.image_url] : [],
      });

      console.log(`Sent announcement "${announcement.title}" to #${channel.name}`);
    } catch (error) {
      console.error(`Failed to send announcement:`, error);
    }
  }
}
