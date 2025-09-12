// src/services/reminder.service.js
const cron = require('node-cron');
const GrowthCalendar = require('../models/GrowthCalendar');
const User = require('../models/User');
const { 
  sendTaskReminderEmail, 
  sendHarvestCountdownEmail, 
  sendCustomReminderEmail 
} = require('./email.service');
const logger = require('../utils/logger');
const notificationService = require('./notification.service');

class ReminderService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the reminder service with cron jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn('Reminder service is already running');
      return;
    }

    // Run every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
      logger.info('Running daily reminder check...');
      await this.checkAndSendReminders();
    });

    // Run every 6 hours for urgent reminders (harvest countdown)
    cron.schedule('0 */6 * * *', async () => {
      logger.info('Running harvest countdown check...');
      await this.checkHarvestCountdown();
    });

    this.isRunning = true;
    logger.info('Reminder service started successfully');
  }

  /**
   * Stop the reminder service
   */
  stop() {
    cron.destroy();
    this.isRunning = false;
    logger.info('Reminder service stopped');
  }

  /**
   * Check for upcoming tasks and send reminders
   */
  async checkAndSendReminders() {
    try {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

      // Get all active calendars
      const calendars = await GrowthCalendar.find({ isActive: true })
        .populate('user', 'name email');

      let remindersSent = 0;

      for (const calendar of calendars) {
        const user = calendar.user;
        if (!user || !user.email) continue;

        // Check tasks due today
        const tasksDueToday = calendar.getTasksDueWithin(0);
        for (const task of tasksDueToday) {
          if (!task.reminderSent) {
            await this.sendTaskReminder(user.email, user.name, task);
            await this.markReminderSent(calendar._id, task);
            // Also send push if available
            try {
              await notificationService.sendPushNotification({
                title: `Task due today: ${task.name}`,
                message: task.description || 'Please complete your task.',
              }, user);
            } catch {}
            remindersSent++;
          }
        }

        // Check tasks due tomorrow (24h before)
        const tasksDueTomorrow = calendar.getTasksDueWithin(1);
        for (const task of tasksDueTomorrow) {
          if (!task.reminderSent) {
            await this.sendTaskReminder(user.email, user.name, task);
            await this.markReminderSent(calendar._id, task);
            try {
              await notificationService.sendPushNotification({
                title: `Task due tomorrow: ${task.name}`,
                message: task.description || 'Scheduled for tomorrow.',
              }, user);
            } catch {}
            remindersSent++;
          }
        }

        // Check custom reminders
        const customReminders = calendar.customReminders.filter(reminder => {
          const reminderDate = new Date(reminder.date);
          return reminderDate >= today && 
                 reminderDate <= dayAfterTomorrow && 
                 !reminder.isCompleted && 
                 !reminder.reminderSent;
        });

        for (const reminder of customReminders) {
          await this.sendCustomReminder(user.email, user.name, reminder);
          await this.markCustomReminderSent(calendar._id, reminder);
          // Send push if type is firebase
          if (reminder.type === 'firebase') {
            try {
              await notificationService.sendPushNotification({
                title: `Reminder: ${reminder.task}`,
                message: reminder.description || 'Upcoming reminder.',
              }, user);
            } catch {}
          }
          remindersSent++;
        }
      }

      logger.info(`Sent ${remindersSent} reminders successfully`);
    } catch (error) {
      logger.error('Error checking and sending reminders:', error);
    }
  }

  /**
   * Check harvest countdown and send alerts
   */
  async checkHarvestCountdown() {
    try {
      const calendars = await GrowthCalendar.find({ 
        isActive: true,
        harvestDate: { $exists: true, $ne: null }
      }).populate('user', 'name email');

      let harvestAlertsSent = 0;

      for (const calendar of calendars) {
        const user = calendar.user;
        if (!user || !user.email) continue;

        const daysLeft = calendar.remainingDaysToHarvest;
        
        // Send alerts for critical harvest periods
        if (daysLeft <= 0 || daysLeft <= 3 || daysLeft <= 7) {
          // Check if we already sent an alert for this harvest period
          const lastAlertSent = calendar.lastHarvestAlertSent;
          const shouldSendAlert = !lastAlertSent || 
            (daysLeft <= 0 && lastAlertSent !== 'harvest_ready') ||
            (daysLeft <= 3 && daysLeft > 0 && lastAlertSent !== 'harvest_soon') ||
            (daysLeft <= 7 && daysLeft > 3 && lastAlertSent !== 'harvest_approaching');

          if (shouldSendAlert) {
            await this.sendHarvestCountdown(user.email, user.name, calendar);
            await this.markHarvestAlertSent(calendar._id, daysLeft);
            harvestAlertsSent++;
          }
        }
      }

      logger.info(`Sent ${harvestAlertsSent} harvest countdown alerts`);
    } catch (error) {
      logger.error('Error checking harvest countdown:', error);
    }
  }

  /**
   * Send task reminder email
   */
  async sendTaskReminder(userEmail, userName, taskData) {
    try {
      await sendTaskReminderEmail(userEmail, userName, taskData);
      logger.info(`Task reminder sent to ${userEmail} for task: ${taskData.name}`);
    } catch (error) {
      logger.error(`Failed to send task reminder to ${userEmail}:`, error);
    }
  }

  /**
   * Send harvest countdown email
   */
  async sendHarvestCountdown(userEmail, userName, calendarData) {
    try {
      await sendHarvestCountdownEmail(userEmail, userName, calendarData);
      logger.info(`Harvest countdown sent to ${userEmail} for crop: ${calendarData.cropName}`);
    } catch (error) {
      logger.error(`Failed to send harvest countdown to ${userEmail}:`, error);
    }
  }

  /**
   * Send custom reminder email
   */
  async sendCustomReminder(userEmail, userName, reminderData) {
    try {
      await sendCustomReminderEmail(userEmail, userName, reminderData);
      logger.info(`Custom reminder sent to ${userEmail} for: ${reminderData.title}`);
    } catch (error) {
      logger.error(`Failed to send custom reminder to ${userEmail}:`, error);
    }
  }

  /**
   * Mark task reminder as sent
   */
  async markReminderSent(calendarId, task) {
    try {
      await GrowthCalendar.updateOne(
        { 
          _id: calendarId,
          'stages.tasks._id': task._id 
        },
        { 
          $set: { 
            'stages.$.tasks.$[task].reminderSent': true,
            'stages.$.tasks.$[task].reminderSentAt': new Date()
          }
        },
        { 
          arrayFilters: [{ 'task._id': task._id }]
        }
      );
    } catch (error) {
      logger.error('Error marking reminder as sent:', error);
    }
  }

  /**
   * Mark custom reminder as sent
   */
  async markCustomReminderSent(calendarId, reminder) {
    try {
      await GrowthCalendar.updateOne(
        { 
          _id: calendarId,
          'customReminders._id': reminder._id 
        },
        { 
          $set: { 
            'customReminders.$.reminderSent': true
          }
        }
      );
    } catch (error) {
      logger.error('Error marking custom reminder as sent:', error);
    }
  }

  /**
   * Mark harvest alert as sent
   */
  async markHarvestAlertSent(calendarId, daysLeft) {
    try {
      let alertType;
      if (daysLeft <= 0) {
        alertType = 'harvest_ready';
      } else if (daysLeft <= 3) {
        alertType = 'harvest_soon';
      } else if (daysLeft <= 7) {
        alertType = 'harvest_approaching';
      }

      await GrowthCalendar.updateOne(
        { _id: calendarId },
        { 
          $set: { 
            lastHarvestAlertSent: alertType,
            lastHarvestAlertSentAt: new Date()
          }
        }
      );
    } catch (error) {
      logger.error('Error marking harvest alert as sent:', error);
    }
  }

  /**
   * Manually trigger reminder check (for testing)
   */
  async triggerManualCheck() {
    logger.info('Manual reminder check triggered');
    await this.checkAndSendReminders();
    await this.checkHarvestCountdown();
  }
}

// Create singleton instance
const reminderService = new ReminderService();

module.exports = reminderService;


