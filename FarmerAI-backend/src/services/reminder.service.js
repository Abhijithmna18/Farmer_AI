// src/services/reminder.service.js
const cron = require('node-cron');
const GrowthCalendar = require('../models/GrowthCalendar');
const User = require('../models/User');
const Booking = require('../models/Booking'); // Added Booking model
const Warehouse = require('../models/Warehouse'); // Added Warehouse model
const { 
  sendTaskReminderEmail, 
  sendHarvestCountdownEmail, 
  sendCustomReminderEmail,
  sendWarehouseBookingReminder,
  sendWarehouseOwnerReminder
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
      await this.checkWarehouseBookingReminders(); // Added warehouse booking reminders
    });

    // Run every 6 hours for urgent reminders (harvest countdown and urgent booking reminders)
    cron.schedule('0 */6 * * *', async () => {
      logger.info('Running harvest countdown check...');
      await this.checkHarvestCountdown();
      await this.checkUrgentWarehouseBookingReminders(); // Added urgent warehouse booking reminders
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
   * Check for upcoming warehouse bookings and send reminders
   */
  async checkWarehouseBookingReminders() {
    try {
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Get all active bookings that are approved and ending within 7 days
      const upcomingBookings = await Booking.find({
        status: 'approved',
        'bookingDates.endDate': {
          $gte: today,
          $lte: sevenDaysFromNow
        }
      }).populate([
        { path: 'farmer', select: 'firstName lastName email phone' },
        { path: 'warehouseOwner', select: 'firstName lastName email phone' },
        { path: 'warehouse', select: 'name location' }
      ]);

      let remindersSent = 0;

      for (const booking of upcomingBookings) {
        const daysRemaining = Math.ceil((booking.bookingDates.endDate - today) / (1000 * 60 * 60 * 24));
        
        // Send reminders 7 days and 3 days before end date
        if (daysRemaining === 7 || daysRemaining === 3) {
          // Check if we've already sent a reminder for this period
          const reminderKey = `reminder_${daysRemaining}_days`;
          if (!booking.remindersSent || !booking.remindersSent.includes(reminderKey)) {
            // Send reminder to farmer
            if (booking.farmer && booking.farmer.email) {
              await this.sendWarehouseBookingReminder(
                booking.farmer.email,
                booking.farmer.firstName,
                booking.farmer.lastName,
                booking,
                daysRemaining
              );
            }
            
            // Send reminder to warehouse owner
            if (booking.warehouseOwner && booking.warehouseOwner.email) {
              await this.sendWarehouseOwnerReminder(
                booking.warehouseOwner.email,
                booking.warehouseOwner.firstName,
                booking.warehouseOwner.lastName,
                booking,
                daysRemaining
              );
            }
            
            // Mark reminder as sent
            await this.markBookingReminderSent(booking._id, reminderKey);
            remindersSent++;
          }
        }
      }

      logger.info(`Sent ${remindersSent} warehouse booking reminders successfully`);
    } catch (error) {
      logger.error('Error checking warehouse booking reminders:', error);
    }
  }

  /**
   * Check for urgent warehouse booking reminders (less than 3 days)
   */
  async checkUrgentWarehouseBookingReminders() {
    try {
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Get all active bookings that are approved and ending within 3 days
      const urgentBookings = await Booking.find({
        status: 'approved',
        'bookingDates.endDate': {
          $gte: today,
          $lte: threeDaysFromNow
        }
      }).populate([
        { path: 'farmer', select: 'firstName lastName email phone' },
        { path: 'warehouseOwner', select: 'firstName lastName email phone' },
        { path: 'warehouse', select: 'name location' }
      ]);

      let remindersSent = 0;

      for (const booking of urgentBookings) {
        const daysRemaining = Math.ceil((booking.bookingDates.endDate - today) / (1000 * 60 * 60 * 24));
        
        // Send urgent reminders for 2, 1, and 0 days remaining
        if (daysRemaining <= 2 && daysRemaining >= 0) {
          // Check if we've already sent an urgent reminder for this period
          const reminderKey = `urgent_reminder_${daysRemaining}_days`;
          if (!booking.remindersSent || !booking.remindersSent.includes(reminderKey)) {
            // Send urgent reminder to farmer
            if (booking.farmer && booking.farmer.email) {
              await this.sendWarehouseBookingReminder(
                booking.farmer.email,
                booking.farmer.firstName,
                booking.farmer.lastName,
                booking,
                daysRemaining
              );
            }
            
            // Send urgent reminder to warehouse owner
            if (booking.warehouseOwner && booking.warehouseOwner.email) {
              await this.sendWarehouseOwnerReminder(
                booking.warehouseOwner.email,
                booking.warehouseOwner.firstName,
                booking.warehouseOwner.lastName,
                booking,
                daysRemaining
              );
            }
            
            // Mark reminder as sent
            await this.markBookingReminderSent(booking._id, reminderKey);
            remindersSent++;
          }
        }
      }

      logger.info(`Sent ${remindersSent} urgent warehouse booking reminders successfully`);
    } catch (error) {
      logger.error('Error checking urgent warehouse booking reminders:', error);
    }
  }

  /**
   * Send warehouse booking reminder email to farmer
   */
  async sendWarehouseBookingReminder(farmerEmail, firstName, lastName, booking, daysRemaining) {
    try {
      const farmerName = `${firstName || ''} ${lastName || ''}`.trim() || 'Farmer';
      
      await sendWarehouseBookingReminder(farmerEmail, {
        farmerName,
        bookingId: booking.bookingId || String(booking._id),
        warehouseName: booking.warehouse?.name || 'Warehouse',
        warehouseLocation: `${booking.warehouse?.location?.city || ''}, ${booking.warehouse?.location?.state || ''}`,
        produceType: booking.produce?.type || 'Produce',
        quantity: booking.produce?.quantity || 0,
        unit: booking.produce?.unit || 'units',
        startDate: booking.bookingDates?.startDate ? new Date(booking.bookingDates.startDate).toLocaleDateString() : 'N/A',
        endDate: booking.bookingDates?.endDate ? new Date(booking.bookingDates.endDate).toLocaleDateString() : 'N/A',
        daysRemaining,
        totalAmount: booking.pricing?.totalAmount || 0
      });
      
      logger.info(`Warehouse booking reminder sent to farmer ${farmerEmail} for booking: ${booking._id}`);
    } catch (error) {
      logger.error(`Failed to send warehouse booking reminder to farmer ${farmerEmail}:`, error);
    }
  }

  /**
   * Send warehouse booking reminder email to owner
   */
  async sendWarehouseOwnerReminder(ownerEmail, firstName, lastName, booking, daysRemaining) {
    try {
      const ownerName = `${firstName || ''} ${lastName || ''}`.trim() || 'Owner';
      
      await sendWarehouseOwnerReminder(ownerEmail, {
        ownerName,
        bookingId: booking.bookingId || String(booking._id),
        warehouseName: booking.warehouse?.name || 'Warehouse',
        farmerName: `${booking.farmer?.firstName || ''} ${booking.farmer?.lastName || ''}`.trim() || 'Farmer',
        farmerEmail: booking.farmer?.email || 'N/A',
        farmerPhone: booking.farmer?.phone || 'N/A',
        produceType: booking.produce?.type || 'Produce',
        quantity: booking.produce?.quantity || 0,
        unit: booking.produce?.unit || 'units',
        startDate: booking.bookingDates?.startDate ? new Date(booking.bookingDates.startDate).toLocaleDateString() : 'N/A',
        endDate: booking.bookingDates?.endDate ? new Date(booking.bookingDates.endDate).toLocaleDateString() : 'N/A',
        daysRemaining
      });
      
      logger.info(`Warehouse booking reminder sent to owner ${ownerEmail} for booking: ${booking._id}`);
    } catch (error) {
      logger.error(`Failed to send warehouse booking reminder to owner ${ownerEmail}:`, error);
    }
  }

  /**
   * Mark booking reminder as sent
   */
  async markBookingReminderSent(bookingId, reminderKey) {
    try {
      await Booking.updateOne(
        { _id: bookingId },
        { 
          $push: { remindersSent: reminderKey },
          $set: { [`reminderSentAt_${reminderKey}`]: new Date() }
        }
      );
    } catch (error) {
      logger.error('Error marking booking reminder as sent:', error);
    }
  }

  /**
   * Manually trigger reminder check (for testing)
   */
  async triggerManualCheck() {
    logger.info('Manual reminder check triggered');
    await this.checkAndSendReminders();
    await this.checkHarvestCountdown();
    await this.checkWarehouseBookingReminders(); // Added
    await this.checkUrgentWarehouseBookingReminders(); // Added
  }
}

// Create singleton instance
const reminderService = new ReminderService();

module.exports = reminderService;


