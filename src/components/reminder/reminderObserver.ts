import { EventEmitter } from 'events';
import { Client } from 'discord.js';
import * as reminderComponents from './reminder';

export class ReminderObserver extends EventEmitter {
  private client: Client;
  private scheduledTimeouts: Map<number, NodeJS.Timeout> = new Map();
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
  }

  async start() {
    console.log('🔔 Reminder Observer started');
    this.globalCheckInterval = setInterval(async () => {
      await this.checkForDueReminders();
    }, 60 * 1000);
    await this.checkForDueReminders();
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

  private async sendReminder(reminder: any) {
    try {
      const user = await this.client.users.fetch(reminder.user_id);
      if (user) {
        await user.send({
          embeds: [
            {
              title: '🔔 Reminder!',
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
}
