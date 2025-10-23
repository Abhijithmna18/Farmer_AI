// src/controllers/market.controller.js

// Deterministic pseudo-random generator so charts look stable across reloads
function seededRand(seed) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

function genSeries(seed, base, jitter = 10, days = 7) {
  const rnd = seededRand(seed);
  return Array.from({ length: days }, () => Math.round(base + (rnd() - 0.5) * jitter));
}

// GET /api/market/prices?crops=Maize,Mustard,Tomato&days=7
exports.getPrices = async (req, res) => {
  try {
    const days = Math.max(1, Math.min(parseInt(req.query.days) || 7, 30));
    const cropsParam = (req.query.crops || 'Maize,Mustard,Tomato').split(',').map(s => s.trim()).filter(Boolean);

    // Baselines and jitter per crop (example INR per quintal)
    const baselines = {
      Maize: { base: 1980, jitter: 35, seed: 101 },
      Mustard: { base: 5530, jitter: 60, seed: 202 },
      Tomato: { base: 26, jitter: 6, seed: 303 }
    };

    const labels = Array.from({ length: days }, (_, i) => `Day ${i + 1}`);
    const series = cropsParam.map((crop) => {
      const cfg = baselines[crop] || { base: 100, jitter: 10, seed: 999 };
      return { crop, prices: genSeries(cfg.seed, cfg.base, cfg.jitter, days) };
    });

    return res.json({
      success: true,
      data: {
        labels,
        series,
        currency: 'INR',
        unit: 'per quintal'
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'Failed to fetch market prices' });
  }
};
