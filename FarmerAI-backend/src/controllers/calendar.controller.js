const GrowthCalendar = require('../models/GrowthCalendar');
const weatherService = require('../services/weather.service');
const { toMalayalam, fromMalayalam } = require('../utils/malayalamDate');

// Create a new growth calendar
exports.createGrowthCalendar = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.cropName) {
      return res.status(400).json({ message: 'cropName is required' });
    }
    // Malayalam calendar support: if calendarSystem is malayalam and planting is provided in Malayalam, derive Gregorian
    if (payload.calendarSystem === 'malayalam' && payload.malayalamDates?.planting && !payload.plantingDate) {
      const { planting } = payload.malayalamDates;
      payload.plantingDate = fromMalayalam({
        year: Number(planting.year),
        monthIndex: Number(planting.monthIndex || 0),
        day: Number(planting.day || 1)
      });
    }
    if (!payload.plantingDate) {
      return res.status(400).json({ message: 'plantingDate is required (or provide Malayalam planting date with calendarSystem="malayalam")' });
    }

    // Attach user if available (Auth middleware can set req.user)
    if (req.user?.id) payload.user = req.user.id;

    // Compute Malayalam equivalents for top-level dates
    const plantingML = toMalayalam(payload.plantingDate);
    const harvestML = payload.estimatedHarvestDate ? toMalayalam(payload.estimatedHarvestDate) : null;
    payload.malayalamDates = payload.malayalamDates || {};
    payload.malayalamDates.planting = {
      year: plantingML.year,
      monthIndex: plantingML.monthIndex,
      month: plantingML.month,
      day: plantingML.day,
    };
    if (harvestML) {
      payload.malayalamDates.estimatedHarvest = {
        year: harvestML.year,
        monthIndex: harvestML.monthIndex,
        month: harvestML.month,
        day: harvestML.day,
      };
    }

    const created = await GrowthCalendar.create(payload);
    return res.json(created);
  } catch (err) {
    console.error('createGrowthCalendar error:', err);
    return res.status(500).json({ message: 'Failed to create growth calendar' });
  }
};

// List calendars with optional filters
exports.getGrowthCalendars = async (req, res) => {
  try {
    const { year, season, isActive } = req.query;
    const filter = {};
    if (year) filter.year = Number(year);
    if (season) filter.season = season;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    // Development mode: do not scope by req.user to show all calendars

    const calendars = await GrowthCalendar.find(filter).sort({ createdAt: -1 });
    return res.json({ data: calendars });
  } catch (err) {
    console.error('getGrowthCalendars error:', err);
    return res.status(500).json({ message: 'Failed to fetch growth calendars' });
  }
};

// Get by ID
exports.getGrowthCalendarById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID is required' });
    const calendar = await GrowthCalendar.findById(id);
    if (!calendar) return res.status(404).json({ message: 'Growth calendar not found' });
    return res.json(calendar);
  } catch (err) {
    console.error('getGrowthCalendarById error:', err);
    return res.status(500).json({ message: 'Failed to fetch calendar' });
  }
};

// Update calendar
exports.updateGrowthCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body || {};
    const updated = await GrowthCalendar.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'Growth calendar not found' });
    return res.json(updated);
  } catch (err) {
    console.error('updateGrowthCalendar error:', err);
    return res.status(500).json({ message: 'Failed to update calendar' });
  }
};

// Delete calendar
exports.deleteGrowthCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await GrowthCalendar.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Growth calendar not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteGrowthCalendar error:', err);
    return res.status(500).json({ message: 'Failed to delete calendar' });
  }
};

// --- Crop Events Management ---
exports.addCropEvent = async (req, res) => {
  try {
    const { id } = req.params; // calendarId
    const event = req.body;
    if (!event?.type || !event?.title || !event?.date) {
      return res.status(400).json({ message: 'type, title, and date are required for an event' });
    }
    const calendar = await GrowthCalendar.findById(id);
    if (!calendar) return res.status(404).json({ message: 'Calendar not found' });
    calendar.cropEvents.push({ ...event, createdBy: req.user?.id });
    await calendar.save();
    const createdEvent = calendar.cropEvents[calendar.cropEvents.length - 1];
    return res.json(createdEvent);
  } catch (err) {
    console.error('addCropEvent error:', err);
    return res.status(500).json({ message: 'Failed to add crop event' });
  }
};

exports.updateCropEvent = async (req, res) => {
  try {
    const { id, eventId } = req.params;
    const update = req.body || {};
    const calendar = await GrowthCalendar.findById(id);
    if (!calendar) return res.status(404).json({ message: 'Calendar not found' });
    const ev = calendar.cropEvents.id(eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    Object.assign(ev, update);
    await calendar.save();
    return res.json(ev);
  } catch (err) {
    console.error('updateCropEvent error:', err);
    return res.status(500).json({ message: 'Failed to update crop event' });
  }
};

exports.deleteCropEvent = async (req, res) => {
  try {
    const { id, eventId } = req.params;
    const calendar = await GrowthCalendar.findById(id);
    if (!calendar) return res.status(404).json({ message: 'Calendar not found' });
    const ev = calendar.cropEvents.id(eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    ev.remove();
    await calendar.save();
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteCropEvent error:', err);
    return res.status(500).json({ message: 'Failed to delete crop event' });
  }
};

// --- Analytics ---
exports.getCalendarAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const calendar = await GrowthCalendar.findById(id);
    if (!calendar) return res.status(404).json({ message: 'Calendar not found' });

    const totalTasks = calendar.cropEvents?.length || 0;
    const completedTasks = calendar.cropEvents?.filter(e => e.isCompleted)?.length || 0;
    const missedTasks = calendar.cropEvents?.filter(e => !e.isCompleted && new Date(e.date) < new Date())?.length || 0;

    const planting = new Date(calendar.plantingDate);
    const harvest = calendar.estimatedHarvestDate ? new Date(calendar.estimatedHarvestDate) : null;
    const averageGrowthDuration = harvest ? Math.round((harvest - planting) / (1000 * 60 * 60 * 24)) : null;

    const analytics = {
      totalCropsSown: 1,
      averageGrowthDuration: averageGrowthDuration || 0,
      missedTasks,
      completedTasks,
      totalTasks,
      completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
      expectedYield: calendar.analytics?.expectedYield ?? null,
      actualYield: calendar.analytics?.actualYield ?? null,
    };

    return res.json(analytics);
  } catch (err) {
    console.error('getCalendarAnalytics error:', err);
    return res.status(500).json({ message: 'Failed to compute analytics' });
  }
};

// --- Weather Suggestions ---
exports.getWeatherSuggestions = async (req, res) => {
  try {
    const { latitude, longitude, activity } = req.query;
    if (!latitude || !longitude) return res.status(400).json({ message: 'latitude and longitude are required' });
    const weather = await weatherService.getCurrentWeather(Number(latitude), Number(longitude));
    const suggestions = weatherService.getWeatherSuggestions(weather, activity || 'sowing');
    return res.json({ weather, suggestions });
  } catch (err) {
    console.error('getWeatherSuggestions error:', err);
    return res.status(500).json({ message: 'Failed to get weather suggestions' });
  }
};

// --- AI: Schedule Generation ---
exports.generateAISchedule = async (req, res) => {
  try {
    const { cropName, soilType, region } = req.body || {};
    let { plantingDate } = req.body || {};
    // Allow Malayalam input: if not plantingDate but malayalamDates.planting present, derive
    if (!plantingDate && req.body?.malayalamDates?.planting) {
      const p = req.body.malayalamDates.planting;
      plantingDate = fromMalayalam({ year: Number(p.year), monthIndex: Number(p.monthIndex||0), day: Number(p.day||1) });
    }
    if (!cropName || !plantingDate) {
      return res.status(400).json({ message: 'cropName and plantingDate are required' });
    }
    const baseDurations = {
      wheat: 120,
      rice: 150,
      maize: 110,
      soybean: 100,
      potato: 90
    };
    const key = (cropName || '').toLowerCase();
    let duration = baseDurations[key] || 100;
    if ((soilType || '').toLowerCase().includes('clay')) duration += 10;
    if ((soilType || '').toLowerCase().includes('sandy')) duration -= 5;

    const start = new Date(plantingDate);
    const plantingML = toMalayalam(start);
    const advice = [];

    // Adjust schedule heuristics based on Malayalam month (monsoon cycles etc.)
    // Karkidakam (monsoon): emphasize drainage, reduce early irrigation, recommend paddy varieties suited for monsoon
    if (plantingML.month === 'Karkidakam') {
      advice.push('Monsoon season (Karkidakam): prioritize paddy varieties suited for heavy rain. Ensure field drainage.');
    }
    // Chingam (post-monsoon start): good for many crops; schedule initial fertilization slightly later
    if (plantingML.month === 'Chingam') {
      advice.push('Chingam: post-monsoon start. Favor vegetables and short-duration cereals; adjust fertilization to week 4.');
    }
    // Medam–Edavam: summer showers onset in Kerala
    if (['Medam','Edavam'].includes(plantingML.month)) {
      advice.push('Pre-monsoon (Medam/Edavam): plan soil moisture conservation and mulching; schedule irrigation based on local showers.');
    }
    const addDays = (d) => new Date(start.getTime() + d * 24 * 60 * 60 * 1000);

    // Base schedule
    let schedule = [
      { type: 'sowing', title: 'Sowing', date: start, description: `Sow ${cropName}` },
      { type: 'irrigation', title: 'Irrigation', date: addDays(7), description: 'Initial irrigation after sowing' },
      { type: 'fertilization', title: 'Fertilization', date: addDays(21), description: 'Apply NPK 10-10-10' },
      { type: 'pest_control', title: 'Pest Control', date: addDays(35), description: 'Inspect and treat if needed' },
      { type: 'weeding', title: 'Weeding', date: addDays(28), description: 'Manual/chemical weeding' },
      { type: 'harvest', title: 'Harvest', date: addDays(duration), description: 'Expected harvest window' }
    ];

    // Malayalam month specific adjustments
    if (plantingML.month === 'Karkidakam') {
      // Push first irrigation later and soften amount (front-end can interpret description)
      schedule = schedule.map(ev => ev.type === 'irrigation' ? { ...ev, date: addDays(10), description: 'If heavy rain, delay irrigation and ensure drainage' } : ev);
    }
    if (plantingML.month === 'Chingam') {
      schedule = schedule.map(ev => ev.type === 'fertilization' ? { ...ev, date: addDays(28), description: 'Apply NPK after 4 weeks (post-monsoon adjustment)' } : ev);
    }

    return res.json({ schedule, estimatedHarvestDate: addDays(duration), advice, plantingMalayalam: plantingML });
  } catch (err) {
    console.error('generateAISchedule error:', err);
    return res.status(500).json({ message: 'Failed to generate AI schedule' });
  }
};

// --- AI: Yield Prediction ---
exports.predictYield = async (req, res) => {
  try {
    const { cropName, soilType, area, irrigationFrequency, fertilizerType, historicalYield = [] } = req.body || {};
    if (!cropName || !area) return res.status(400).json({ message: 'cropName and area are required' });

    // Simple heuristic model
    let base = 2000; // kg per hectare baseline
    const cropFactor = { wheat: 1.0, rice: 1.1, maize: 1.2, soybean: 0.9, potato: 1.5 }[(cropName || '').toLowerCase()] || 1.0;
    const soilFactor = (soilType || '').toLowerCase().includes('loam') ? 1.1 : (soilType || '').toLowerCase().includes('clay') ? 0.95 : 1.0;
    const irrigationFactor = Math.min(1.2, 0.8 + (Number(irrigationFrequency || 3) / 10));
    const fertilizerFactor = (fertilizerType || '').toLowerCase().includes('npk') ? 1.05 : 1.0;
    const historyAvg = historicalYield.length ? (historicalYield.reduce((a, b) => a + b, 0) / historicalYield.length) : base;
    const historyFactor = Math.min(1.2, Math.max(0.8, historyAvg / base));

    const yieldPerHa = base * cropFactor * soilFactor * irrigationFactor * fertilizerFactor * historyFactor;
    const estimatedYield = Math.round(yieldPerHa * Number(area));

    return res.json({ estimatedYieldKg: estimatedYield, yieldPerHectareKg: Math.round(yieldPerHa) });
  } catch (err) {
    console.error('predictYield error:', err);
    return res.status(500).json({ message: 'Failed to predict yield' });
  }
};

// --- Malayalam Calendars mapped endpoint ---
exports.getMalayalamCalendars = async (req, res) => {
  try {
    const { year, season, isActive } = req.query;
    const filter = {};
    if (year) filter.year = Number(year);
    if (season) filter.season = season;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const calendars = await GrowthCalendar.find(filter).sort({ createdAt: -1 });
    const mapped = calendars.map((c) => {
      const plantingML = c.plantingDate ? toMalayalam(c.plantingDate) : null;
      const harvestML = c.estimatedHarvestDate ? toMalayalam(c.estimatedHarvestDate) : null;
      const events = (c.cropEvents || []).map((e) => ({
        ...e.toObject(),
        malayalamDate: e.date ? toMalayalam(e.date) : null,
      }));
      return {
        ...c.toObject(),
        malayalamDates: {
          planting: plantingML,
          estimatedHarvest: harvestML,
        },
        cropEvents: events,
      };
    });
    return res.json({ data: mapped });
  } catch (err) {
    console.error('getMalayalamCalendars error:', err);
    return res.status(500).json({ message: 'Failed to fetch Malayalam calendars' });
  }
};
