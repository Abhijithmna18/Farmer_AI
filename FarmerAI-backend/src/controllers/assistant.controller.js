const Interaction = require('../models/Interaction.js');
const AssistantHistory = require('../models/AssistantHistory');
const { askGemini } = require('../services/gemini.service');
const notificationService = require('../services/notification.service');

// Mock function to get crop recommendations
const getMockRecommendations = (soilType, season, location) => {
  // In a real application, this would involve a more complex logic,
  // potentially using a machine learning model or a comprehensive database.
  const recommendations = {
    loamy: {
      summer: ['Tomatoes', 'Peppers', 'Cucumbers', 'Zucchini', 'Corn'],
      winter: ['Carrots', 'Onions', 'Potatoes', 'Broccoli', 'Cabbage'],
    },
    sandy: {
      summer: ['Watermelon', 'Melons', 'Sweet Potatoes', 'Groundnuts', 'Cowpeas'],
      winter: ['Lettuce', 'Radishes', 'Beets', 'Kale', 'Spinach'],
    },
    clay: {
      summer: ['Rice', 'Sugarcane', 'Paddy', 'Sorghum', 'Millet'],
      winter: ['Wheat', 'Barley', 'Mustard', 'Lentils', 'Chickpeas'],
    },
  };

  return recommendations[soilType]?.[season] || ['No specific recommendations for this combination.'];
};

// Simple cultivation guide snippets per crop
const cultivationGuides = {
  Tomatoes: {
    landPrep: 'Well-drained loamy soil, add compost, pH 6.0–6.8.',
    sowing: 'Transplant seedlings 45–60 cm apart.',
    fertilizer: 'NPK 10-10-10 at planting; side-dress during flowering.',
    irrigation: 'Keep soil moist, avoid waterlogging; drip preferred.',
    harvesting: '60–80 days after transplant, pick at breaker stage.'
  },
  Wheat: {
    landPrep: 'Fine tilth, ensure proper drainage.',
    sowing: 'Broadcast or drill, 18–22 cm row spacing.',
    fertilizer: 'N: 120 kg/ha split; P & K at basal.',
    irrigation: 'Irrigate at CRI, tillering, flowering, dough stages.',
    harvesting: 'When grains are hard and golden.'
  }
  // Add more as needed
};

const getRecommendations = async (req, res) => {
  const { soilType, season, location } = req.body;
  const userId = req.user.id;

  if (!soilType || !season || !location) {
    return res.status(400).json({ message: 'Soil type, season, and location are required.' });
  }

  const recommendedCrops = getMockRecommendations(soilType, season, location);

  const interaction = new Interaction({
    user: userId,
    soilType,
    season,
    location,
    recommendedCrops,
  });

  await interaction.save();

  res.json({
    recommendations: recommendedCrops,
    interactionId: interaction._id
  });
};

// Mark selected crop for an interaction
const selectCrop = async (req, res) => {
  const userId = req.user.id;
  const { interactionId, selectedCrop } = req.body;
  if (!interactionId || !selectedCrop) {
    return res.status(400).json({ message: 'interactionId and selectedCrop are required.' });
  }
  const interaction = await Interaction.findOne({ _id: interactionId, user: userId });
  if (!interaction) return res.status(404).json({ message: 'Interaction not found' });
  interaction.selectedCrop = selectedCrop;
  await interaction.save();
  res.json({ message: 'Selection saved', interaction });
};

// Return a simple cultivation guide for a crop
const getCultivationGuide = async (req, res) => {
  const { crop } = req.query;
  if (!crop) return res.status(400).json({ message: 'crop is required' });
  const guide = cultivationGuides[crop] || {
    landPrep: 'Prepare soil to fine tilth with organic matter.',
    sowing: 'Use healthy seeds/seedlings, follow local spacing.',
    fertilizer: 'Apply balanced NPK based on soil test.',
    irrigation: 'Irrigate regularly, avoid waterlogging.',
    harvesting: 'Harvest at optimal maturity for quality.'
  };
  res.json({ crop, guide });
};

const getInteractions = async (req, res) => {
  const userId = req.user.id;
  const interactions = await Interaction.find({ user: userId }).sort({ timestamp: -1 });
  res.json({ interactions });
};

module.exports = {
  getRecommendations,
  getInteractions,
  selectCrop,
  getCultivationGuide,
  // New: ask Gemini and store history
  ask: async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const { query, language = 'en', sendReminder } = req.body;
      if (!query) return res.status(400).json({ message: 'query is required' });

      const reply = await askGemini(query, language);

      const history = await AssistantHistory.create({ userId, query, reply, language });

      // Optional: push a reminder via FCM
      if (sendReminder && typeof sendReminder === 'string') {
        try {
          await notificationService.sendPushNotification({ title: 'Assistant Reminder', message: sendReminder }, req.user);
        } catch {}
      }

      res.json({ success: true, data: { reply, historyId: history._id } });
    } catch (e) {
      res.status(500).json({ message: e.message || 'Assistant error' });
    }
  },
  // New: get history for a user (admin can read any)
  history: async (req, res) => {
    try {
      const { userId } = req.params;
      const requesterId = req.user.id || req.user._id;
      const isAdmin = Array.isArray(req.user.roles) ? req.user.roles.includes('admin') : (req.user.role === 'admin');
      const match = isAdmin ? { userId } : { userId: requesterId };
      const items = await AssistantHistory.find(match).sort({ createdAt: -1 }).lean();
      res.json({ success: true, data: items });
    } catch (e) {
      res.status(500).json({ message: e.message || 'Failed to fetch history' });
    }
  }
  ,
  // Insights: tasks, market trends, weather (structured)
  insights: async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const location = (req.query.location || 'kerala').toLowerCase();
      const prompt = `Generate weekly farming tasks (Kerala, post-monsoon, Sept 11, 2025), last 7-day market price trends for rubber & pepper, and 5-day weather forecast with temp & humidity. Return ONLY JSON in this exact shape: {"tasks":["..."],"marketTrends":{"rubber":[n,n,n,n,n,n,n],"pepper":[n,n,n,n,n,n,n]},"weather":[{"day":"Fri","icon":"rain","temp":28,"humidity":80}]}`;

      const reply = await askGemini(prompt, 'en');

      let data;
      try {
        const jsonStart = reply.indexOf('{');
        const jsonEnd = reply.lastIndexOf('}');
        data = JSON.parse(reply.slice(jsonStart, jsonEnd + 1));
      } catch (e) {
        return res.status(502).json({ message: 'Gemini returned unexpected format', raw: reply });
      }

      await AssistantHistory.create({
        userId,
        type: 'insight',
        query: prompt,
        reply,
        metadata: { location, parsed: data }
      });

      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ message: e.message || 'Failed to fetch insights' });
    }
  }
  ,
  // Mark a task completed and log pro tip
  completeTask: async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const { task, proTip } = req.body;
      if (!task) return res.status(400).json({ message: 'task is required' });
      await AssistantHistory.create({ userId, type: 'insight', query: 'task_complete', reply: `Completed: ${task}`, metadata: { task, proTip } });
      res.json({ success: true, message: 'Task marked complete', proTip: proTip || null });
    } catch (e) {
      res.status(500).json({ message: e.message || 'Failed to complete task' });
    }
  }
  ,
  // Add a custom task
  addCustomTask: async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const { title, dueDate, reminder } = req.body;
      if (!title) return res.status(400).json({ message: 'title is required' });
      await AssistantHistory.create({ userId, type: 'insight', query: 'custom_task', reply: title, metadata: { dueDate, reminder } });
      // Optionally schedule push notification using existing reminder service/notification service in future
      res.json({ success: true, message: 'Custom task added' });
    } catch (e) {
      res.status(500).json({ message: e.message || 'Failed to add custom task' });
    }
  }
  ,
  // Register a price alert
  setPriceAlert: async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const { commodity, threshold } = req.body;
      if (!commodity || typeof threshold !== 'number') {
        return res.status(400).json({ message: 'commodity and numeric threshold are required' });
      }
      await AssistantHistory.create({ userId, type: 'insight', query: 'price_alert', reply: `${commodity}:${threshold}`, metadata: { commodity, threshold } });
      res.json({ success: true, message: 'Price alert set' });
    } catch (e) {
      res.status(500).json({ message: e.message || 'Failed to set price alert' });
    }
  }
};