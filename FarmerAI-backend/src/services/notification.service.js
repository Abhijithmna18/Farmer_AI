// Notification service for Growth Calendar
const { sendEmail } = require('./email.service');
const { admin } = require('../config/firebase');
const GrowthCalendar = require('../models/GrowthCalendar');
const User = require('../models/User');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.notificationQueue = [];
    this.isProcessing = false;
    this.startScheduler();
  }

  // Start the notification scheduler
  startScheduler() {
    // Check for notifications every minute
    setInterval(() => {
      this.processNotifications();
    }, 60000);

    // Process queue every 30 seconds
    setInterval(() => {
      this.processQueue();
    }, 30000);

    logger.info('Notification service started');
  }

  // Create a notification
  async createNotification(calendarId, eventId, userId, type, title, message, scheduledFor) {
    try {
      const notification = {
        type,
        title,
        message,
        scheduledFor: new Date(scheduledFor),
        eventId,
        userId,
        isSent: false
      };

      // Add to calendar
      await GrowthCalendar.findByIdAndUpdate(
        calendarId,
        { $push: { notifications: notification } }
      );

      logger.info(`Notification created for user ${userId}: ${title}`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  // Process notifications that are due
  async processNotifications() {
    try {
      const now = new Date();
      
      // Find calendars with notifications due
      const calendars = await GrowthCalendar.find({
        'notifications.scheduledFor': { $lte: now },
        'notifications.isSent': false
      }).populate('user', 'email name');

      for (const calendar of calendars) {
        const dueNotifications = calendar.notifications.filter(
          notification => 
            notification.scheduledFor <= now && 
            !notification.isSent
        );

        for (const notification of dueNotifications) {
          await this.sendNotification(notification, calendar.user);
        }
      }
    } catch (error) {
      logger.error('Error processing notifications:', error);
    }
  }

  // Send a notification
  async sendNotification(notification, user) {
    try {
      let sent = false;

      switch (notification.type) {
        case 'email':
          sent = await this.sendEmailNotification(notification, user);
          break;
        case 'in_app':
          sent = await this.sendInAppNotification(notification, user);
          break;
        case 'firebase':
        case 'push':
          sent = await this.sendPushNotification(notification, user);
          break;
        case 'sms':
          sent = await this.sendSMSNotification(notification, user);
          break;
        default:
          logger.warn(`Unknown notification type: ${notification.type}`);
      }

      if (sent) {
        // Mark as sent
        await GrowthCalendar.updateOne(
          { 'notifications._id': notification._id },
          { 
            $set: { 
              'notifications.$.isSent': true,
              'notifications.$.sentAt': new Date()
            }
          }
        );

        logger.info(`Notification sent successfully: ${notification.title}`);
      }
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  // Send email notification
  async sendEmailNotification(notification, user) {
    try {
      await sendEmail({
        to: user.email,
        subject: `FarmerAI: ${notification.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🌱 FarmerAI</h1>
            </div>
            <div style="padding: 20px; background: #f9fafb;">
              <h2 style="color: #374151; margin-top: 0;">${notification.title}</h2>
              <p style="color: #6b7280; line-height: 1.6;">${notification.message}</p>
              <div style="margin-top: 20px; padding: 15px; background: #e5f3ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  💡 <strong>Tip:</strong> Check your growth calendar for more details and upcoming tasks.
                </p>
              </div>
            </div>
            <div style="padding: 20px; text-align: center; background: #f3f4f6;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated notification from FarmerAI. 
                <br>You can manage your notification preferences in your account settings.
              </p>
            </div>
          </div>
        `
      });

      return true;
    } catch (error) {
      logger.error('Error sending email notification:', error);
      return false;
    }
  }

  // Send in-app notification (store in user's notification list)
  async sendInAppNotification(notification, user) {
    try {
      // Add to user's in-app notifications
      await User.findByIdAndUpdate(
        user._id,
        { 
          $push: { 
            inAppNotifications: {
              title: notification.title,
              message: notification.message,
              type: 'calendar_reminder',
              read: false,
              createdAt: new Date()
            }
          }
        }
      );

      return true;
    } catch (error) {
      logger.error('Error sending in-app notification:', error);
      return false;
    }
  }

  // Send SMS notification (placeholder - would integrate with SMS service)
  async sendSMSNotification(notification, user) {
    try {
      // This would integrate with an SMS service like Twilio
      logger.info(`SMS notification would be sent to ${user.phone}: ${notification.title}`);
      
      // For now, just log the SMS
      return true;
    } catch (error) {
      logger.error('Error sending SMS notification:', error);
      return false;
    }
  }

  // Send Firebase Cloud Messaging push notification
  async sendPushNotification(notification, user) {
    try {
      if (!admin || !admin.messaging) return false;
      const tokens = Array.isArray(user.pushTokens) ? user.pushTokens : (user.pushToken ? [user.pushToken] : []);
      if (!tokens.length) return false;

      const message = {
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          type: 'calendar_reminder',
          calendarNotificationId: String(notification._id || ''),
        },
        tokens
      };
      const response = await admin.messaging().sendMulticast(message);
      return (response.successCount || 0) > 0;
    } catch (error) {
      logger.error('Error sending FCM push notification:', error);
      return false;
    }
  }

  // Create event reminder notifications
  async createEventReminders(calendarId, event) {
    try {
      const eventDate = new Date(event.date);
      const userId = event.createdBy;

      // Create reminders at different intervals
      const reminderIntervals = [
        { days: 7, title: 'Upcoming Event (1 week)', message: `Your ${event.type} event "${event.title}" is scheduled for next week.` },
        { days: 3, title: 'Upcoming Event (3 days)', message: `Your ${event.type} event "${event.title}" is scheduled in 3 days.` },
        { days: 1, title: 'Event Tomorrow', message: `Don't forget! Your ${event.type} event "${event.title}" is scheduled for tomorrow.` },
        { hours: 2, title: 'Event Starting Soon', message: `Your ${event.type} event "${event.title}" is starting in 2 hours.` }
      ];

      for (const reminder of reminderIntervals) {
        let scheduledFor;
        
        if (reminder.days) {
          scheduledFor = new Date(eventDate);
          scheduledFor.setDate(scheduledFor.getDate() - reminder.days);
        } else if (reminder.hours) {
          scheduledFor = new Date(eventDate);
          scheduledFor.setHours(scheduledFor.getHours() - reminder.hours);
        }

        // Only create reminder if it's in the future
        if (scheduledFor > new Date()) {
          await this.createNotification(
            calendarId,
            event._id,
            userId,
            'email',
            reminder.title,
            reminder.message,
            scheduledFor
          );
        }
      }

      logger.info(`Event reminders created for event: ${event.title}`);
    } catch (error) {
      logger.error('Error creating event reminders:', error);
    }
  }

  // Create weather-based notifications
  async createWeatherNotifications(calendarId, event, weatherData) {
    try {
      const userId = event.createdBy;
      const eventDate = new Date(event.date);
      const now = new Date();
      
      // Only create weather notifications for events in the next 7 days
      if (eventDate > now && eventDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        let shouldNotify = false;
        let title = '';
        let message = '';

        switch (event.type) {
          case 'irrigation':
            if (weatherData.precipitation > 5) {
              shouldNotify = true;
              title = 'Weather Alert: Irrigation Recommendation';
              message = `Heavy rain (${weatherData.precipitation}mm) is forecasted for your irrigation event "${event.title}". Consider postponing to avoid overwatering.`;
            }
            break;

          case 'fertilization':
            if (weatherData.windSpeed > 15) {
              shouldNotify = true;
              title = 'Weather Alert: Fertilization Recommendation';
              message = `High winds (${weatherData.windSpeed} km/h) are forecasted for your fertilization event "${event.title}". Consider using granular fertilizer or postponing.`;
            }
            break;

          case 'harvest':
            if (weatherData.precipitation > 2) {
              shouldNotify = true;
              title = 'Weather Alert: Harvest Recommendation';
              message = `Rain (${weatherData.precipitation}mm) is forecasted for your harvest event "${event.title}". Consider postponing or using protective measures.`;
            }
            break;

          case 'sowing':
            if (weatherData.temperature < 10) {
              shouldNotify = true;
              title = 'Weather Alert: Sowing Recommendation';
              message = `Low temperature (${weatherData.temperature}°C) is forecasted for your sowing event "${event.title}". Consider waiting for warmer conditions.`;
            }
            break;
        }

        if (shouldNotify) {
          // Schedule notification for 1 day before event
          const notificationDate = new Date(eventDate);
          notificationDate.setDate(notificationDate.getDate() - 1);

          await this.createNotification(
            calendarId,
            event._id,
            userId,
            'email',
            title,
            message,
            notificationDate
          );

          logger.info(`Weather notification created for event: ${event.title}`);
        }
      }
    } catch (error) {
      logger.error('Error creating weather notifications:', error);
    }
  }

  // Process notification queue
  async processQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        await this.processNotification(notification);
      }
    } catch (error) {
      logger.error('Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processNotification(notification) {
    // Implementation for processing queued notifications
    logger.info(`Processing queued notification: ${notification.title}`);
  }

  // Get user's notification preferences
  async getUserNotificationPreferences(userId) {
    try {
      const user = await User.findById(userId).select('notificationPreferences');
      return user?.notificationPreferences || {
        email: {
          weather: true,
          soil: true,
          growth: true,
          reports: false
        },
        sms: {
          weather: false,
          soil: false,
          growth: true,
          reports: false
        }
      };
    } catch (error) {
      logger.error('Error getting notification preferences:', error);
      return null;
    }
  }

  // Update user's notification preferences
  async updateUserNotificationPreferences(userId, preferences) {
    try {
      await User.findByIdAndUpdate(
        userId,
        { notificationPreferences: preferences }
      );

      logger.info(`Notification preferences updated for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      return false;
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await GrowthCalendar.updateMany(
        {},
        {
          $pull: {
            notifications: {
              sentAt: { $lt: thirtyDaysAgo }
            }
          }
        }
      );

      logger.info('Old notifications cleaned up');
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;


