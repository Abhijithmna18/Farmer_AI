const GrowthCalendar = require('../models/GrowthCalendar');
const weatherService = require('../services/weather.service');
const { sendEmail } = require('../services/email.service');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Create a new growth calendar
exports.createGrowthCalendar = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const calendarData = {
      ...req.body,
      user: userId,
      year: new Date().getFullYear(),
      season: `${new Date().getFullYear()}-${getSeason(new Date())}`
    };

    const calendar = new GrowthCalendar(calendarData);
    await calendar.save();

    logger.info(`Growth calendar created: ${calendar._id} for user: ${userId}`);
    res.status(201).json({
      success: true,
      message: 'Growth calendar created successfully',
      data: calendar
    });
  } catch (error) {
    logger.error('Error creating growth calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create growth calendar',
      error: error.message
    });
  }
};

// Get all growth calendars for the current user
exports.getGrowthCalendars = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { year, season, isActive } = req.query;

    const filter = {};
    // Admin can view all; normal users only their own
    const isAdmin = Array.isArray(req.user.roles) ? req.user.roles.includes('admin') : (req.user.role === 'admin');
    if (!isAdmin) filter.user = userId;
    if (year) filter.year = parseInt(year);
    if (season) filter.season = season;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const calendars = await GrowthCalendar.find(filter)
      .populate('collaborators.user', 'name email')
      .sort({ createdAt: -1 });

    logger.info(`Retrieved ${calendars.length} calendars for user: ${userId}`);
    res.json({
      success: true,
      data: calendars
    });
  } catch (error) {
    logger.error('Error fetching growth calendars:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch growth calendars',
      error: error.message
    });
  }
};

// Get a specific growth calendar by ID
exports.getGrowthCalendarById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const isAdmin = Array.isArray(req.user.roles) ? req.user.roles.includes('admin') : (req.user.role === 'admin');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid calendar ID'
      });
    }

    const match = isAdmin ? { _id: id } : { _id: id, user: userId };
    const calendar = await GrowthCalendar.findOne(match)
      .populate('collaborators.user', 'name email')
      .populate('cropEvents.createdBy', 'name email');

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Growth calendar not found'
      });
    }

    // Update stage statuses for response (non-persistent quick calc)
    const now = new Date();
    calendar.stages = (calendar.stages || []).map((stage) => {
      const start = stage.startDate ? new Date(stage.startDate) : null;
      const end = stage.endDate ? new Date(stage.endDate) : null;
      let newStatus = stage.status;
      if (start && end) {
        if (now < start) newStatus = 'upcoming';
        else if (now >= start && now <= end) newStatus = 'active';
        else if (now > end) newStatus = 'completed';
      }
      stage.status = newStatus;
      return stage;
    });

    logger.info(`Retrieved calendar: ${id} (${isAdmin ? 'admin access' : userId})`);
    res.json({
      success: true,
      data: calendar
    });
  } catch (error) {
    logger.error('Error fetching growth calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch growth calendar',
      error: error.message
    });
  }
};

// Update a growth calendar
exports.updateGrowthCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const isAdmin = Array.isArray(req.user.roles) ? req.user.roles.includes('admin') : (req.user.role === 'admin');
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid calendar ID'
      });
    }

    const calendar = await GrowthCalendar.findOneAndUpdate(
      isAdmin ? { _id: id } : { _id: id, user: userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Growth calendar not found'
      });
    }

    logger.info(`Updated calendar: ${id} for user: ${userId}`);
    res.json({
      success: true,
      message: 'Growth calendar updated successfully',
      data: calendar
    });
  } catch (error) {
    logger.error('Error updating growth calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update growth calendar',
      error: error.message
    });
  }
};

// Delete a growth calendar
exports.deleteGrowthCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const isAdmin = Array.isArray(req.user.roles) ? req.user.roles.includes('admin') : (req.user.role === 'admin');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid calendar ID'
      });
    }

    const calendar = await GrowthCalendar.findOneAndDelete(isAdmin ? { _id: id } : { _id: id, user: userId });

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Growth calendar not found'
      });
    }

    logger.info(`Deleted calendar: ${id} for user: ${userId}`);
    res.json({
      success: true,
      message: 'Growth calendar deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting growth calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete growth calendar',
      error: error.message
    });
  }
};

// Add a crop event to a calendar
exports.addCropEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const eventData = {
      ...req.body,
      createdBy: userId
    };

    // Get weather data if coordinates are provided
    if (eventData.location && eventData.location.coordinates) {
      const { latitude, longitude } = eventData.location.coordinates;
      const weatherData = await weatherService.getCurrentWeather(latitude, longitude);
      eventData.weatherSnapshot = weatherData;
    }

    const calendar = await GrowthCalendar.findOneAndUpdate(
      { _id: id, user: userId },
      { $push: { cropEvents: eventData } },
      { new: true }
    );

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Growth calendar not found'
      });
    }

    // Create notification if event has a future date
    if (eventData.date > new Date()) {
      await createEventNotification(calendar._id, eventData, userId);
    }

    logger.info(`Added crop event to calendar: ${id}`);
    res.json({
      success: true,
      message: 'Crop event added successfully',
      data: calendar.cropEvents[calendar.cropEvents.length - 1]
    });
  } catch (error) {
    logger.error('Error adding crop event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add crop event',
      error: error.message
    });
  }
};

// Update a crop event
exports.updateCropEvent = async (req, res) => {
  try {
    const { id, eventId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const calendar = await GrowthCalendar.findOne({ _id: id, user: userId });
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Growth calendar not found'
      });
    }

    const eventIndex = calendar.cropEvents.findIndex(
      event => event._id.toString() === eventId
    );

    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Crop event not found'
      });
    }

    // Update the event
    calendar.cropEvents[eventIndex] = {
      ...calendar.cropEvents[eventIndex].toObject(),
      ...updateData
    };

    await calendar.save();

    logger.info(`Updated crop event: ${eventId} in calendar: ${id}`);
    res.json({
      success: true,
      message: 'Crop event updated successfully',
      data: calendar.cropEvents[eventIndex]
    });
  } catch (error) {
    logger.error('Error updating crop event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update crop event',
      error: error.message
    });
  }
};

// Delete a crop event
exports.deleteCropEvent = async (req, res) => {
  try {
    const { id, eventId } = req.params;
    const userId = req.user.id;

    const calendar = await GrowthCalendar.findOneAndUpdate(
      { _id: id, user: userId },
      { $pull: { cropEvents: { _id: eventId } } },
      { new: true }
    );

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Growth calendar not found'
      });
    }

    logger.info(`Deleted crop event: ${eventId} from calendar: ${id}`);
    res.json({
      success: true,
      message: 'Crop event deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting crop event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete crop event',
      error: error.message
    });
  }
};

// Get calendar analytics
exports.getCalendarAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const calendar = await GrowthCalendar.findOne({ _id: id, user: userId });
    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Growth calendar not found'
      });
    }

    const analytics = calculateAnalytics(calendar);
    
    // Update analytics in database
    calendar.analytics = analytics;
    await calendar.save();

    logger.info(`Generated analytics for calendar: ${id}`);
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error generating analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics',
      error: error.message
    });
  }
};

// Get weather suggestions for an activity
exports.getWeatherSuggestions = async (req, res) => {
  try {
    const { latitude, longitude, activity } = req.query;

    if (!latitude || !longitude || !activity) {
      return res.status(400).json({
        success: false,
        message: 'Latitude, longitude, and activity are required'
      });
    }

    const weatherData = await weatherService.getCurrentWeather(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    const suggestions = weatherService.getWeatherSuggestions(weatherData, activity);

    res.json({
      success: true,
      data: {
        weather: weatherData,
        suggestions
      }
    });
  } catch (error) {
    logger.error('Error getting weather suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weather suggestions',
      error: error.message
    });
  }
};

// Helper functions
function getSeason(date) {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

function calculateAnalytics(calendar) {
  const events = calendar.cropEvents || [];
  const completedEvents = events.filter(event => event.isCompleted);
  const missedEvents = events.filter(event => 
    !event.isCompleted && new Date(event.date) < new Date()
  );

  const totalCropsSown = events.filter(event => event.type === 'sowing').length;
  
  let averageGrowthDuration = 0;
  if (calendar.plantingDate && calendar.estimatedHarvestDate) {
    averageGrowthDuration = Math.ceil(
      (new Date(calendar.estimatedHarvestDate) - new Date(calendar.plantingDate)) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    totalCropsSown,
    averageGrowthDuration,
    missedTasks: missedEvents.length,
    completedTasks: completedEvents.length,
    totalTasks: events.length,
    completionRate: events.length > 0 ? (completedEvents.length / events.length) * 100 : 0,
    season: calendar.season,
    calculatedAt: new Date()
  };
}

async function createEventNotification(calendarId, event, userId) {
  try {
    // Create notification for 3 days before event
    const notificationDate = new Date(event.date);
    notificationDate.setDate(notificationDate.getDate() - 3);

    const notification = {
      type: 'email',
      title: `Upcoming: ${event.title}`,
      message: `Your ${event.type} event "${event.title}" is scheduled for ${new Date(event.date).toLocaleDateString()}`,
      scheduledFor: notificationDate,
      eventId: event._id,
      userId
    };

    // Store notification in calendar
    await GrowthCalendar.findByIdAndUpdate(
      calendarId,
      { $push: { notifications: notification } }
    );

    logger.info(`Created notification for event: ${event._id}`);
  } catch (error) {
    logger.error('Error creating event notification:', error);
  }
}

// Get calendars with remaining days until estimated harvest
exports.getCalendarsWithRemainingDays = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const isAdmin = Array.isArray(req.user.roles) ? req.user.roles.includes('admin') : (req.user.role === 'admin');
    const calendars = await GrowthCalendar.find(isAdmin ? {} : { user: userId }).sort({ createdAt: -1 });

    const now = new Date();
    const result = calendars.map((calendar) => {
      let remainingDays = null;
      if (calendar.estimatedHarvestDate) {
        remainingDays = Math.ceil(
          (new Date(calendar.estimatedHarvestDate) - now) / (1000 * 60 * 60 * 24)
        );
      }
      return {
        _id: calendar._id,
        cropName: calendar.cropName,
        plantingDate: calendar.plantingDate,
        estimatedHarvestDate: calendar.estimatedHarvestDate,
        season: calendar.season,
        year: calendar.year,
        remainingDays,
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error fetching calendars with remaining days:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch calendars', error: error.message });
  }
};

// Get active calendars for a specific user, sorted by nearest harvest date
exports.getActiveCalendarsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id || req.user._id;
    const isAdmin = Array.isArray(req.user.roles) ? req.user.roles.includes('admin') : (req.user.role === 'admin');

    if (!isAdmin && String(userId) !== String(requesterId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const calendars = await GrowthCalendar.find({ user: userId, isActive: true })
      .lean();

    const now = new Date();
    const withComputed = calendars.map((cal) => {
      const target = cal.harvestDate || cal.estimatedHarvestDate;
      const remainingDays = target ? Math.ceil((new Date(target) - now) / (1000 * 60 * 60 * 24)) : null;
      return { ...cal, remainingDaysToHarvest: remainingDays };
    });

    withComputed.sort((a, b) => {
      const aDate = a.harvestDate || a.estimatedHarvestDate || null;
      const bDate = b.harvestDate || b.estimatedHarvestDate || null;
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return new Date(aDate) - new Date(bDate);
    });

    res.json({ success: true, data: withComputed });
  } catch (error) {
    logger.error('Error fetching active calendars:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active calendars', error: error.message });
  }
};

// Add a growth stage to a calendar
exports.addGrowthStage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const stage = req.body;

    const calendar = await GrowthCalendar.findOne({ _id: id, user: userId });
    if (!calendar) {
      return res.status(404).json({ success: false, message: 'Growth calendar not found' });
    }

    if (stage.startDate && stage.endDate && !stage.expectedDuration) {
      stage.expectedDuration = Math.ceil(
        (new Date(stage.endDate) - new Date(stage.startDate)) / (1000 * 60 * 60 * 24)
      );
    }

    calendar.stages.push(stage);
    await calendar.save();

    res.status(201).json({ success: true, message: 'Stage added', data: calendar.stages[calendar.stages.length - 1] });
  } catch (error) {
    logger.error('Error adding growth stage:', error);
    res.status(500).json({ success: false, message: 'Failed to add stage', error: error.message });
  }
};

// Add a task to a specific stage
exports.addTaskToStage = async (req, res) => {
  try {
    const { id, stageName } = req.params;
    const userId = req.user.id;
    const task = req.body;

    const calendar = await GrowthCalendar.findOne({ _id: id, user: userId });
    if (!calendar) {
      return res.status(404).json({ success: false, message: 'Growth calendar not found' });
    }

    const stage = calendar.stages.find((s) => s.stageName === stageName);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Stage not found' });
    }

    stage.tasks.push(task);
    await calendar.save();

    res.status(201).json({ success: true, message: 'Task added', data: stage.tasks[stage.tasks.length - 1] });
  } catch (error) {
    logger.error('Error adding task to stage:', error);
    res.status(500).json({ success: false, message: 'Failed to add task', error: error.message });
  }
};

// Update a task's completion status
exports.updateTaskCompletion = async (req, res) => {
  try {
    const { id, stageName, taskId } = req.params;
    const userId = req.user.id;
    const { isCompleted, completedAt } = req.body;

    const calendar = await GrowthCalendar.findOne({ _id: id, user: userId });
    if (!calendar) {
      return res.status(404).json({ success: false, message: 'Growth calendar not found' });
    }

    const stage = calendar.stages.find((s) => s.stageName === stageName);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Stage not found' });
    }

    const task = stage.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (typeof isCompleted === 'boolean') {
      task.isCompleted = isCompleted;
      task.completedAt = isCompleted ? (completedAt ? new Date(completedAt) : new Date()) : undefined;
    }

    await calendar.save();
    res.json({ success: true, message: 'Task updated', data: task });
  } catch (error) {
    logger.error('Error updating task completion:', error);
    res.status(500).json({ success: false, message: 'Failed to update task', error: error.message });
  }
};

// Add a custom reminder
exports.addCustomReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const reminder = req.body;

    const calendar = await GrowthCalendar.findOne({ _id: id, user: userId });
    if (!calendar) {
      return res.status(404).json({ success: false, message: 'Growth calendar not found' });
    }

    calendar.customReminders.push(reminder);
    await calendar.save();

    res.status(201).json({ success: true, message: 'Reminder added', data: calendar.customReminders[calendar.customReminders.length - 1] });
  } catch (error) {
    logger.error('Error adding custom reminder:', error);
    res.status(500).json({ success: false, message: 'Failed to add reminder', error: error.message });
  }
};

// Get upcoming reminders for the current user
exports.getUpcomingReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const calendars = await GrowthCalendar.find({ user: userId });
    const reminders = [];

    calendars.forEach((cal) => {
      (cal.customReminders || []).forEach((r) => {
        if (new Date(r.date) >= now) {
          reminders.push({
            calendarId: cal._id,
            cropName: cal.cropName,
            title: r.title,
            date: r.date,
            description: r.description,
          });
        }
      });
    });

    reminders.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ success: true, data: reminders });
  } catch (error) {
    logger.error('Error fetching upcoming reminders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reminders', error: error.message });
  }
};

// Update harvest record for a calendar
exports.updateHarvestRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const record = req.body;

    const calendar = await GrowthCalendar.findOne({ _id: id, user: userId });
    if (!calendar) {
      return res.status(404).json({ success: false, message: 'Growth calendar not found' });
    }

    calendar.harvestRecords.push(record);
    await calendar.save();

    res.json({ success: true, message: 'Harvest record updated', data: calendar.harvestRecords[calendar.harvestRecords.length - 1] });
  } catch (error) {
    logger.error('Error updating harvest record:', error);
    res.status(500).json({ success: false, message: 'Failed to update harvest record', error: error.message });
  }
};
