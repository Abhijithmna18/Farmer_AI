// src/controllers/recommendation.controller.js
const CropRecommendation = require('../models/CropRecommendation');
const { askGemini } = require('../services/gemini.service');
const SoilRecommendation = require('../models/SoilRecommendation');

exports.generate = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { soilType = 'Loamy', location = 'Kerala', season = 'post-monsoon', salt = '' } = req.body || {};

    const prompt = `Given soil=${soilType}, season=${season}, location=${location}, recommend 5 crops.
Return ONLY JSON array of 5 items with fields: crop, variety, reason, expectedYield, profitEstimation.`;

    // Build a robust fallback in case Gemini is unavailable with variation per day and inputs
    const seeded = (s) => {
      let h = 2166136261;
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24); }
      return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
    };
    const shuffleSeeded = (arr, rnd) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const buildFallback = () => {
      const dayKey = new Date().toISOString().slice(0,10);
      const key = `${soilType}|${season}|${location}|${dayKey}|${salt}`;
      const rnd = seeded(key);
      const poolBySoil = {
        loamy: ['Barley','Pea','Cabbage','Carrot','Tomato','Maize','Potato','Mustard'],
        sandy: ['Groundnut','Sesame','Watermelon','Millet','Cowpea','Cassava','Sweet Potato'],
        clay: ['Rice','Sugarcane','Paddy','Wheat','Banana','Turmeric','Ginger']
      };
      const pool = poolBySoil[String(soilType).toLowerCase()] || ['Barley','Pea','Cabbage','Carrot','Tomato','Maize','Potato','Mustard'];
      const varieties = {
        Barley:'RD 250', Pea:'Arkel', Cabbage:'Golden Acre', Carrot:'Pusa Rudhira', Tomato:'Pusa Ruby', Maize:'HQPM-1', Potato:'Kufri Jyoti', Mustard:'Pusa Bold',
        Groundnut:'GG 20', Sesame:'Til-1', Watermelon:'Sugar Baby', Millet:'Proso', Cowpea:'Pusa Komal', Cassava:'M-4', 'Sweet Potato':'Kanti',
        Rice:'Jaya', Sugarcane:'Co 86032', Paddy:'Swarna', Wheat:'HD 2967', Banana:'Robusta', Turmeric:'Erode local', Ginger:'Nadia'
      };
      const reasons = {
        'post-monsoon':'Favorable residual moisture and moderate temps',
        summer:'High heat tolerance or short duration fits summer window',
        winter:'Cool season crop suited for lower temperatures'
      };
      const shuffled = shuffleSeeded(pool, rnd).slice(0, 5);
      return shuffled.map(crop => ({
        crop,
        variety: varieties[crop] || 'Improved',
        reason: `${reasons[String(season).toLowerCase()] || 'Suitable climate and soil'} in ${location}.`,
        expectedYield: ['Good','Very Good','Moderate'][Math.floor(rnd()*3)] + ' (locally variable)',
        profitEstimation: ['Stable','High','Variable'][Math.floor(rnd()*3)]
      }));
    };

    let reply = '';
    let items = [];
    try {
      reply = await askGemini(prompt, 'en');
      try {
        // Strip code fences if present
        const cleaned = reply
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '');
        const start = cleaned.indexOf('[');
        const end = cleaned.lastIndexOf(']');
        items = JSON.parse(cleaned.slice(start, end + 1));
      } catch (parseErr) {
        console.warn('Recommendation JSON parse failed, using fallback. Parse error:', parseErr?.message);
        items = buildFallback();
      }
    } catch (aiErr) {
      console.warn('Gemini unavailable for recommendations, using fallback:', aiErr?.message);
      reply = `FALLBACK_USED: ${aiErr?.message || 'unknown'}`;
      items = buildFallback();
    }

    // De-duplicate per day and input combo: keep only today's set for given params
    const dayKey = new Date().toISOString().slice(0,10);
    const recKey = `${soilType}|${season}|${location}|${dayKey}|${salt}`;
    try { await CropRecommendation.deleteMany({ userId, 'metadata.key': recKey }); } catch {}
    const docs = await CropRecommendation.insertMany(
      (items || []).slice(0, 5).map((it) => ({ ...it, userId, metadata: { soilType, season, location, dayKey, salt, key: recKey } }))
    );

    // Notify user via email if available
    try {
      const User = require('../models/User');
      const emailService = require('../services/email.service');
      const u = await User.findById(userId).select('email firstName lastName');
      if (u?.email && emailService?.sendGenericEmail) {
        await emailService.sendGenericEmail(u.email, 'New Crop Recommendations', `New crop recommendation available: ${docs?.[0]?.crop || 'a crop'} is optimal this week.`);
      }
    } catch {}

    res.json({ success: true, data: docs, message: 'Recommendations generated' });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to generate recommendations' });
  }
};

exports.listByUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id || req.user.id;
    const items = await CropRecommendation.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch recommendations' });
  }
};

// Soil-based recommendation using NPK, rainfall, humidity
exports.getSoilBased = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { N, P, K, rainfall, humidity, count: _count, mode: _mode, salt: _salt, forgetHistory: _forgetHistory } = req.body || {};
    const count = Math.max(1, Math.min(10, Number(_count) || 5));
    const forgetHistory = _forgetHistory === undefined ? true : Boolean(_forgetHistory);
    const modes = ['balanced','nutrients','rainfall','humidity','npk-heavy','water-stress'];
    const mode = (_mode && modes.includes(String(_mode))) ? String(_mode) : modes[(new Date().getMinutes()) % modes.length];
    const salt = String(_salt || new Date().toISOString().slice(0,16));
    if ([N, P, K, rainfall, humidity].some(v => v == null || isNaN(Number(v)))) {
      return res.status(400).json({ message: 'N, P, K, rainfall, humidity are required numeric fields' });
    }

    const prompt = `You are an agronomy expert for Kerala, India.
Given soil and weather inputs: N=${N}, P=${P}, K=${K}, rainfall=${rainfall} mm, humidity=${humidity}%.
Task: Recommend EXACTLY ${count} crops that best fit these inputs.
Rules:
- Base each item on logical fit to the inputs (nutrients, rainfall, humidity). Mode focus: ${mode}.
- Do NOT reuse or rephrase previous outputs; start fresh using only current inputs.
- Return STRICT JSON array (no extra text) with items having keys:
  crop, variety, season, plantingWindow, yieldEstimation, reason, care.`;

    // Gather user's previously recommended crops (to avoid reuse) unless we are "forgetting" history
    let priorCrops = new Set();
    if (!forgetHistory) {
      const priorDocs = await SoilRecommendation.find({ userId }).select('recommendedCrops.crop').lean();
      priorCrops = new Set();
      for (const d of priorDocs) {
        for (const it of (d?.recommendedCrops || [])) {
          if (it?.crop) priorCrops.add(String(it.crop).trim());
        }
      }
    }

    let arr = [];
    try {
      const reply = await askGemini(prompt, 'en');
      // Robust JSON extraction: strip code fences, then locate the array
      const cleaned = String(reply)
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '');
      const s = cleaned.indexOf('[');
      const e = cleaned.lastIndexOf(']');
      arr = JSON.parse(cleaned.slice(s, e + 1));
    } catch (aiErr) {
      // Fallback to mock data if Gemini fails (e.g., missing GEMINI_API_KEY)
      console.error('Soil-based recommendation AI error:', aiErr?.message || aiErr);
      // Rule-based mock using input-aware scoring for Kerala conditions
      const clamp01 = (x) => Math.max(0, Math.min(1, x));
      const scoreToRange = (val, [min, max]) => {
        if (typeof val !== 'number' || isNaN(val)) return 0;
        if (min === 0 && max === 0) return 0;
        if (val >= min && val <= max) return 1; // perfect fit inside range
        if (val < min) {
          const denom = Math.max(1, min);
          return clamp01(1 - (min - val) / denom);
        }
        // val > max
        const denom = Math.max(1, max);
        return clamp01(1 - (val - max) / denom);
      };

      const cropsPool = [
        { crop: 'Rice', variety: 'Improved', season: 'Kharif', plantingWindow: 'Jun-Aug', yield: '3.5-5 t/ha', care: 'Puddle soil, manage standing water', prefs: { N:[40,120], P:[15,60], K:[30,120], rain:[120,400], hum:[65,95] } },
        { crop: 'Banana', variety: 'Robusta', season: 'Year-round', plantingWindow: 'Jul-Sep', yield: '20-30 t/ha', care: 'Mulch and regular irrigation', prefs: { N:[60,200], P:[20,80], K:[60,250], rain:[100,300], hum:[60,95] } },
        { crop: 'Pepper', variety: 'Panniyur', season: 'Monsoon', plantingWindow: 'Jun-Jul', yield: '1.5-2 t/ha (dried)', care: 'Provide live standards and shade', prefs: { N:[30,80], P:[15,50], K:[30,100], rain:[150,300], hum:[70,95] } },
        { crop: 'Coconut', variety: 'Tall', season: 'Year-round', plantingWindow: 'Jun-Aug', yield: '80-120 nuts/palm/year', care: 'Apply FYM and NPK annually', prefs: { N:[50,150], P:[20,60], K:[60,180], rain:[100,300], hum:[60,90] } },
        { crop: 'Okra', variety: 'Arka Anamika', season: 'Summer/Monsoon', plantingWindow: 'Jun-Aug', yield: '8-10 t/ha', care: 'Control pests; drip irrigation preferred', prefs: { N:[30,90], P:[15,45], K:[30,90], rain:[60,180], hum:[50,80] } },
        { crop: 'Maize', variety: 'HQPM-1', season: 'Kharif', plantingWindow: 'Jun-Jul', yield: '3-6 t/ha', care: 'Balanced fertilization; weed control', prefs: { N:[60,160], P:[20,60], K:[40,120], rain:[80,200], hum:[45,75] } },
        { crop: 'Groundnut', variety: 'GG 20', season: 'Kharif', plantingWindow: 'Jun-Jul', yield: '1.2-2 t/ha', care: 'Light soils preferred; gypsum at pegging', prefs: { N:[20,60], P:[20,50], K:[20,60], rain:[50,150], hum:[40,70] } },
        { crop: 'Tomato', variety: 'Pusa Ruby', season: 'Rabi/Kharif', plantingWindow: 'Aug-Oct', yield: '20-30 t/ha', care: 'Staking and pest management', prefs: { N:[50,150], P:[20,60], K:[60,160], rain:[60,180], hum:[50,80] } },
        { crop: 'Ginger', variety: 'Nadia', season: 'Monsoon', plantingWindow: 'May-Jun', yield: '12-20 t/ha', care: 'Mulching and shade; adequate moisture', prefs: { N:[60,150], P:[20,60], K:[80,160], rain:[150,300], hum:[70,95] } },
        { crop: 'Turmeric', variety: 'Erode local', season: 'Monsoon', plantingWindow: 'May-Jun', yield: '20-30 t/ha', care: 'Mulch; keep soil moist and weed-free', prefs: { N:[60,150], P:[20,60], K:[80,160], rain:[150,300], hum:[65,95] } }
      ];

      // Weighting scheme varies by mode to create distinct, input-based reasoning paths per request
      const weightByMode = (m) => {
        switch (m) {
          case 'nutrients': return { N:0.3, P:0.25, K:0.25, rain:0.1, hum:0.1 };
          case 'rainfall': return { N:0.15, P:0.15, K:0.15, rain:0.4, hum:0.15 };
          case 'humidity': return { N:0.15, P:0.15, K:0.15, rain:0.15, hum:0.4 };
          case 'npk-heavy': return { N:0.35, P:0.25, K:0.25, rain:0.075, hum:0.075 };
          case 'water-stress': return { N:0.2, P:0.2, K:0.2, rain:0.25, hum:0.15 };
          default: return { N:0.2, P:0.2, K:0.2, rain:0.2, hum:0.2 };
        }
      };
      const weights = weightByMode(mode);
      const scored = cropsPool.map(c => {
        const sN = scoreToRange(Number(N), c.prefs.N);
        const sP = scoreToRange(Number(P), c.prefs.P);
        const sK = scoreToRange(Number(K), c.prefs.K);
        const sR = scoreToRange(Number(rainfall), c.prefs.rain);
        const sH = scoreToRange(Number(humidity), c.prefs.hum);
        const total = (sN*weights.N) + (sP*weights.P) + (sK*weights.K) + (sR*weights.rain) + (sH*weights.hum);
        const good = [];
        if (sN >= 0.8) good.push('N');
        if (sP >= 0.8) good.push('P');
        if (sK >= 0.8) good.push('K');
        if (sR >= 0.8) good.push('rainfall');
        if (sH >= 0.8) good.push('humidity');
        const reason = good.length
          ? `Matches ${good.join(', ')} levels for ${c.crop} under Kerala conditions.`
          : `Reasonable fit to Kerala climate with provided NPK and weather inputs.`;
        return { ...c, score: Number(total.toFixed(3)), reason };
      })
      .sort((a,b) => b.score - a.score);

      // Filter out any crops previously recommended to the user (unless forgetHistory)
      const fresh = scored.filter(c => !priorCrops.has(c.crop)).slice(0, count).map(c => ({
        crop: c.crop,
        variety: c.variety,
        season: c.season,
        plantingWindow: c.plantingWindow,
        yieldEstimation: c.yield,
        reason: `${c.reason} (mode ${mode}, score ${c.score})`,
        care: c.care
      }));

      // If fewer than count after filtering, fill with remaining highest scoring unused crops
      if (fresh.length < count) {
        for (const c of scored) {
          if (fresh.length >= count) break;
          if (fresh.some(x => x.crop === c.crop)) continue;
          arr = fresh.concat({
            crop: c.crop,
            variety: c.variety,
            season: c.season,
            plantingWindow: c.plantingWindow,
            yieldEstimation: c.yield,
            reason: `${c.reason} (mode ${mode}, score ${c.score})`,
            care: c.care
          });
        }
      } else {
        arr = fresh;
      }
    }

    // If AI returned results, ensure they also respect history and fill using scored pool
    if (arr.length === 0) arr = [];
    // Post-filter AI results
    const filteredAI = arr.filter(it => !priorCrops.has(String(it.crop || '').trim()));
    if (filteredAI.length < count) {
      // Build a scored pool to backfill deterministically based on inputs
      const clamp01 = (x) => Math.max(0, Math.min(1, x));
      const scoreToRange = (val, [min, max]) => {
        if (typeof val !== 'number' || isNaN(val)) return 0;
        if (min === 0 && max === 0) return 0;
        if (val >= min && val <= max) return 1;
        if (val < min) { const denom = Math.max(1, min); return clamp01(1 - (min - val) / denom); }
        const denom = Math.max(1, max); return clamp01(1 - (val - max) / denom);
      };
      const pool = [
        { crop: 'Rice', variety: 'Improved', season: 'Kharif', plantingWindow: 'Jun-Aug', yield: '3.5-5 t/ha', care: 'Puddle soil, manage standing water', prefs: { N:[40,120], P:[15,60], K:[30,120], rain:[120,400], hum:[65,95] } },
        { crop: 'Banana', variety: 'Robusta', season: 'Year-round', plantingWindow: 'Jul-Sep', yield: '20-30 t/ha', care: 'Mulch and regular irrigation', prefs: { N:[60,200], P:[20,80], K:[60,250], rain:[100,300], hum:[60,95] } },
        { crop: 'Pepper', variety: 'Panniyur', season: 'Monsoon', plantingWindow: 'Jun-Jul', yield: '1.5-2 t/ha (dried)', care: 'Provide live standards and shade', prefs: { N:[30,80], P:[15,50], K:[30,100], rain:[150,300], hum:[70,95] } },
        { crop: 'Coconut', variety: 'Tall', season: 'Year-round', plantingWindow: 'Jun-Aug', yield: '80-120 nuts/palm/year', care: 'Apply FYM and NPK annually', prefs: { N:[50,150], P:[20,60], K:[60,180], rain:[100,300], hum:[60,90] } },
        { crop: 'Okra', variety: 'Arka Anamika', season: 'Summer/Monsoon', plantingWindow: 'Jun-Aug', yield: '8-10 t/ha', care: 'Control pests; drip irrigation preferred', prefs: { N:[30,90], P:[15,45], K:[30,90], rain:[60,180], hum:[50,80] } },
        { crop: 'Maize', variety: 'HQPM-1', season: 'Kharif', plantingWindow: 'Jun-Jul', yield: '3-6 t/ha', care: 'Balanced fertilization; weed control', prefs: { N:[60,160], P:[20,60], K:[40,120], rain:[80,200], hum:[45,75] } },
        { crop: 'Groundnut', variety: 'GG 20', season: 'Kharif', plantingWindow: 'Jun-Jul', yield: '1.2-2 t/ha', care: 'Light soils preferred; gypsum at pegging', prefs: { N:[20,60], P:[20,50], K:[20,60], rain:[50,150], hum:[40,70] } },
        { crop: 'Tomato', variety: 'Pusa Ruby', season: 'Rabi/Kharif', plantingWindow: 'Aug-Oct', yield: '20-30 t/ha', care: 'Staking and pest management', prefs: { N:[50,150], P:[20,60], K:[60,160], rain:[60,180], hum:[50,80] } },
        { crop: 'Ginger', variety: 'Nadia', season: 'Monsoon', plantingWindow: 'May-Jun', yield: '12-20 t/ha', care: 'Mulching and shade; adequate moisture', prefs: { N:[60,150], P:[20,60], K:[80,160], rain:[150,300], hum:[70,95] } },
        { crop: 'Turmeric', variety: 'Erode local', season: 'Monsoon', plantingWindow: 'May-Jun', yield: '20-30 t/ha', care: 'Mulch; keep soil moist and weed-free', prefs: { N:[60,150], P:[20,60], K:[80,160], rain:[150,300], hum:[65,95] } }
      ];
      const ws = weightByMode(mode);
      const scoredPool = pool.map(c => {
        const sN = scoreToRange(Number(N), c.prefs.N);
        const sP = scoreToRange(Number(P), c.prefs.P);
        const sK = scoreToRange(Number(K), c.prefs.K);
        const sR = scoreToRange(Number(rainfall), c.prefs.rain);
        const sH = scoreToRange(Number(humidity), c.prefs.hum);
        const total = (sN*ws.N) + (sP*ws.P) + (sK*ws.K) + (sR*ws.rain) + (sH*ws.hum);
        return { ...c, score: Number(total.toFixed(3)) };
      }).sort((a,b)=>b.score-a.score);
      const seen = new Set(filteredAI.map(x => x.crop));
      const out = [...filteredAI];
      for (const c of scoredPool) {
        if (out.length >= count) break;
        if (priorCrops.has(c.crop) || seen.has(c.crop)) continue;
        out.push({ crop:c.crop, variety:c.variety, season:c.season, plantingWindow:c.plantingWindow, yieldEstimation:c.yield, reason:`Input fit (mode ${mode}) score ${c.score}`, care:c.care });
      }
      arr = out.slice(0, count);
    } else {
      // If AI results already yielded 5 fresh items, keep them
      arr = filteredAI.slice(0, count);
    }

    const doc = await SoilRecommendation.create({
      userId,
      N: Number(N), P: Number(P), K: Number(K), rainfall: Number(rainfall), humidity: Number(humidity),
      recommendedCrops: arr.map(it => ({
        crop: it.crop, variety: it.variety, yieldEstimation: it.yieldEstimation, reason: it.reason,
        season: it.season, plantingWindow: it.plantingWindow
      }))
    });

    res.json({ success: true, data: doc });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to generate soil-based recommendation' });
  }
};

exports.listSoilHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const items = await SoilRecommendation.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch soil-based history' });
  }
};

// SoilRecommendation CRUD
exports.getSoilById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const doc = await SoilRecommendation.findOne({ _id: id, userId });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch item' });
  }
};

exports.updateSoil = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const payload = { ...req.body };
    delete payload.userId;
    const updated = await SoilRecommendation.findOneAndUpdate({ _id: id, userId }, payload, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to update item' });
  }
};

exports.deleteSoil = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const deleted = await SoilRecommendation.findOneAndDelete({ _id: id, userId });
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to delete item' });
  }
};

// CropRecommendation minimal CRUD (listByUser exists)
exports.deleteCropRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const deleted = await CropRecommendation.findOneAndDelete({ _id: id, userId });
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to delete item' });
  }
};


