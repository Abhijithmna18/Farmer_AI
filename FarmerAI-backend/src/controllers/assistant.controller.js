const Interaction = require('../models/Interaction.js');
const AssistantHistory = require('../models/AssistantHistory');
const AssistantTask = require('../models/AssistantTask');
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

  let recommendedCrops;
  try {
    const prompt = `Given soil type "${soilType}", season "${season}", and location "${location}", recommend 5 suitable crops for smallholder farmers in India. Return ONLY JSON in this exact shape: {"recommendations":["Crop1","Crop2","Crop3","Crop4","Crop5"]}`;
    const reply = await askGemini(prompt, 'en');
    const cleaned = reply
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '');
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
    const arr = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    recommendedCrops = arr.length ? arr : getMockRecommendations(soilType, season, location);
  } catch (e) {
    recommendedCrops = getMockRecommendations(soilType, season, location);
  }

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
      const prompt = `Generate weekly farming tasks (${location}, post-monsoon, today), last 7-day market price trends for rubber & pepper, and 5-day weather forecast with temp & humidity. Return ONLY JSON in this exact shape: {"tasks":["..."],"marketTrends":{"rubber":[n,n,n,n,n,n,n],"pepper":[n,n,n,n,n,n,n]},"weather":[{"day":"Fri","icon":"rain","temp":28,"humidity":80}]}`;

      // Helper to produce a robust local fallback when Gemini is unavailable or returns bad JSON
      const buildFallback = () => {
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const now = new Date();
        const seq = (n, base = 100, jitter = 5) => Array.from({ length: n }, (_, i) => Math.max(1, Math.round(base + (i - (n-1)/2) * 1.5 + (Math.random()*2-1)*jitter)));
        const weather = Array.from({ length: 5 }, (_, i) => {
          const d = new Date(now.getTime() + i*24*60*60*1000);
          const icon = i % 2 === 0 ? 'rain' : (i % 3 === 0 ? 'cloud' : 'sun');
          const temp = 26 + ((i%3) * 2);
          const humidity = 68 + (i%4)*5;
          return { day: days[d.getDay()], icon, temp, humidity, rain: icon === 'rain' ? 8 + (i%3)*4 : 0 };
        });
        const hourly = Array.from({ length: 12 }, (_, i) => ({
          time: `${(6+i).toString().padStart(2,'0')}:00`,
          icon: i % 4 === 0 ? 'rain' : (i % 3 === 0 ? 'cloud' : 'sun'),
          temp: 24 + Math.round(Math.sin(i/3)*3),
          humidity: 65 + (i%5)*4
        }));
        const tasks = [
          `Inspect fields for fungal issues due to high humidity in ${location}.`,
          'Apply balanced NPK based on soil test; prefer split dose.',
          'Mulch beds to conserve moisture and suppress weeds.',
          'Scout for pests (aphids/mites) and deploy yellow sticky traps.',
          'Schedule irrigation early morning; avoid waterlogging after rains.'
        ];
        return {
          tasks,
          marketTrends: {
            rubber: seq(7, 162, 6),
            pepper: seq(7, 518, 12)
          },
          weather,
          hourly,
          advice: 'High humidity increases disease risk; prioritize field sanitation and timely preventive sprays.'
        };
      };

      let reply = '';
      let data;

      // Try Gemini, but gracefully fallback if it fails or env is missing
      try {
        reply = await askGemini(prompt, 'en');
        try {
          // Some models wrap JSON in code fences; strip them if present
          const cleaned = reply
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '');
          const jsonStart = cleaned.indexOf('{');
          const jsonEnd = cleaned.lastIndexOf('}');
          data = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
        } catch (parseErr) {
          console.warn('Insights JSON parse failed, using fallback. Parse error:', parseErr?.message);
          data = buildFallback();
        }
      } catch (err) {
        // Common case: GEMINI_API_KEY not configured or API error
        console.warn('Gemini unavailable for insights, using fallback:', err?.message);
        reply = `FALLBACK_USED: ${err?.message || 'unknown'}`;
        data = buildFallback();
      }

      try {
        await AssistantHistory.create({
          userId,
          type: 'insight',
          query: prompt,
          reply,
          metadata: { location, parsed: data }
        });
      } catch (logErr) {
        console.warn('Failed to log AssistantHistory for insights:', logErr?.message);
      }

      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ message: e.message || 'Failed to fetch insights' });
    }
  }
  ,
  // --- Task Planner (persistent CRUD) ---
  listTasks: async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const tasks = await AssistantTask.find({ userId }).sort({ completed: 1, createdAt: -1 }).lean();
      return res.json({ success: true, data: tasks });
    } catch (e) {
      return res.status(500).json({ message: e.message || 'Failed to list tasks' });
    }
  },
  createTask: async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const { title, dueDate } = req.body;
      if (!title || !title.trim()) return res.status(400).json({ message: 'title is required' });
      const task = await AssistantTask.create({ userId, title: title.trim(), dueDate: dueDate ? new Date(dueDate) : undefined });
      // Log in history (optional)
      try { await AssistantHistory.create({ userId, type: 'insight', query: 'task_create', reply: title, metadata: { dueDate } }); } catch {}
      return res.status(201).json({ success: true, data: task });
    } catch (e) {
      return res.status(500).json({ message: e.message || 'Failed to create task' });
    }
  },
  markTaskComplete: async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const { id } = req.params;
      const { completed = true, proTip } = req.body || {};
      const task = await AssistantTask.findOne({ _id: id, userId });
      if (!task) return res.status(404).json({ message: 'Task not found' });
      task.completed = !!completed;
      if (proTip) task.proTip = proTip;
      await task.save();
      try { await AssistantHistory.create({ userId, type: 'insight', query: 'task_complete', reply: task.title, metadata: { completed: task.completed, proTip } }); } catch {}
      return res.json({ success: true, data: task });
    } catch (e) {
      return res.status(500).json({ message: e.message || 'Failed to update task' });
    }
  },
  deleteTask: async (req, res) => {
    try {
      const userId = req.user.id || req.user._id;
      const { id } = req.params;
      const task = await AssistantTask.findOneAndDelete({ _id: id, userId });
      if (!task) return res.status(404).json({ message: 'Task not found' });
      try { await AssistantHistory.create({ userId, type: 'insight', query: 'task_delete', reply: task.title }); } catch {}
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ message: e.message || 'Failed to delete task' });
    }
  },
  // --- End Task Planner ---
  
  
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

// Get market price trends for crops
const getMarketTrends = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { crops = ['Rice', 'Wheat', 'Maize'], days = 7 } = req.query;
    
    // Ensure crops is an array
    const cropArray = Array.isArray(crops) ? crops : [crops];
    
    // Create a prompt for Gemini to generate market price trends
    const prompt = `Generate realistic market price trends for the following crops over the last ${days} days in Kerala, India. 
    Crops: ${cropArray.join(', ')}
    
    Return ONLY a JSON object with this exact structure:
    {
      "trends": {
        "cropName1": [price1, price2, ..., price${days}],
        "cropName2": [price1, price2, ..., price${days}]
      },
      "marketDrivers": "Brief explanation of factors affecting prices"
    }
    
    Use realistic price ranges for Kerala agricultural markets. Prices should be in INR per kg.`;

    let reply = '';
    let data;

    // Try Gemini, but gracefully fallback if it fails
    try {
      reply = await askGemini(prompt, 'en');
      try {
        // Strip code fences if present
        const cleaned = reply
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '');
        const jsonStart = cleaned.indexOf('{');
        const jsonEnd = cleaned.lastIndexOf('}');
        data = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
      } catch (parseErr) {
        console.warn('Market trends JSON parse failed, using fallback. Parse error:', parseErr?.message);
        // Fallback with mock data
        data = {
          trends: {},
          marketDrivers: 'Based on typical market conditions in Kerala.'
        };
        
        // Generate mock data for each crop
        for (const crop of cropArray) {
          // Generate a realistic price trend with some variation
          const basePrice = 10 + Math.random() * 40; // Base price between 10-50 INR/kg
          const trend = [];
          for (let i = 0; i < days; i++) {
            // Add some random variation (-10% to +10%)
            const variation = 1 + (Math.random() * 0.2 - 0.1);
            trend.push(parseFloat((basePrice * variation).toFixed(2)));
          }
          data.trends[crop] = trend;
        }
      }
    } catch (err) {
      console.warn('Gemini unavailable for market trends, using fallback:', err?.message);
      reply = `FALLBACK_USED: ${err?.message || 'unknown'}`;
      
      // Fallback with mock data
      data = {
        trends: {},
        marketDrivers: 'Based on typical market conditions in Kerala.'
      };
      
      // Generate mock data for each crop
      for (const crop of cropArray) {
        // Generate a realistic price trend with some variation
        const basePrice = 10 + Math.random() * 40; // Base price between 10-50 INR/kg
        const trend = [];
        for (let i = 0; i < days; i++) {
          // Add some random variation (-10% to +10%)
          const variation = 1 + (Math.random() * 0.2 - 0.1);
          trend.push(parseFloat((basePrice * variation).toFixed(2)));
        }
        data.trends[crop] = trend;
      }
    }

    try {
      await AssistantHistory.create({
        userId,
        type: 'market_trends',
        query: prompt,
        reply,
        metadata: { crops: cropArray, days, parsed: data }
      });
    } catch (logErr) {
      console.warn('Failed to log AssistantHistory for market trends:', logErr?.message);
    }

    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch market trends' });
  }
};

module.exports = {
  ...module.exports,
  getMarketTrends
};