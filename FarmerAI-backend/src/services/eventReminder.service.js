const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const emailService = require('./email.service');
const logger = require('../utils/logger');

let intervalHandle = null;

async function processWindow(windowMinutes = 15) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000);

  // Find events occurring within next window where reminders are configured
  const upcoming = await Event.find({
    status: { $in: ['published', 'verified'] },
    dateTime: { $gte: now, $lte: windowEnd },
    $or: [
      { 'reminders.0': { $exists: true } },
    ]
  }).lean();

  for (const ev of upcoming) {
    const startMs = new Date(ev.dateTime).getTime();
    const regs = await EventRegistration.find({ event: ev._id, status: { $in: ['going','checked_in'] } }).populate('user','email name').lean();
    for (const r of (ev.reminders || [])) {
      try {
        const offsetMs = (r.offsetMinutes || 1440) * 60 * 1000;
        // If now within offset window (tolerance +/- window)
        if (now.getTime() >= (startMs - offsetMs) && now.getTime() <= (startMs - offsetMs + windowMinutes * 60 * 1000)) {
          // Send notifications to attendees
          for (const reg of regs) {
            if (!reg.user?.email) continue;
            const subject = `Reminder: ${ev.title} starts soon`;
            const html = `Hello ${reg.user.name || ''},<br/><br/>This is a reminder that <b>${ev.title}</b> starts at ${new Date(ev.dateTime).toLocaleString()}.<br/>Location: ${ev.locationDetail?.address || ev.location || 'TBA'}<br/><br/>See you there!`;
            await emailService.sendEmail(reg.user.email, subject, html);
          }
          logger.info(`Reminders sent for event ${ev._id} (${ev.title})`);
        }
      } catch (e) {
        logger.warn(`Failed sending reminders for event ${ev._id}: ${e?.message || e}`);
      }
    }
  }
}

function startEventReminderScheduler({ intervalMinutes = 10 } = {}) {
  if (intervalHandle) return; // already running
  logger.info(`Starting Event Reminder Scheduler (every ${intervalMinutes}m)`);
  intervalHandle = setInterval(() => {
    processWindow(intervalMinutes).catch((e) => logger.warn(`Reminder run error: ${e?.message || e}`));
  }, intervalMinutes * 60 * 1000);
  // Run once on boot (delayed a bit)
  setTimeout(() => {
    processWindow(intervalMinutes).catch(() => {});
  }, 5 * 1000);
}

function stopEventReminderScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = { startEventReminderScheduler, stopEventReminderScheduler };





