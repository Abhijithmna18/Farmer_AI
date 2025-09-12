const path = require('path');
const fs = require('fs');

// Load CSV once into memory for fast recommendations
let DATASET = null;
const CSV_HEADERS = ['N','P','K','temperature','humidity','ph','rainfall','label'];

function loadDatasetOnce() {
  if (DATASET) return DATASET;
  const csvPath = path.join(__dirname, '../../data/Crop_recommendation.csv');
  if (!fs.existsSync(csvPath)) {
    console.warn('Crop dataset not found at', csvPath);
    DATASET = [];
    return DATASET;
  }
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = lines.shift();
  const cols = header.split(',').map(h => h.trim().toLowerCase());
  const idx = {
    N: cols.indexOf('n'),
    P: cols.indexOf('p'),
    K: cols.indexOf('k'),
    temperature: cols.indexOf('temperature'),
    humidity: cols.indexOf('humidity'),
    ph: cols.indexOf('ph'),
    rainfall: cols.indexOf('rainfall'),
    label: cols.indexOf('label')
  };
  DATASET = lines.map(line => {
    const parts = line.split(',');
    return {
      N: Number(parts[idx.N]),
      P: Number(parts[idx.P]),
      K: Number(parts[idx.K]),
      temperature: Number(parts[idx.temperature]),
      humidity: Number(parts[idx.humidity]),
      ph: Number(parts[idx.ph]),
      rainfall: Number(parts[idx.rainfall]),
      label: (parts[idx.label] || '').trim()
    };
  }).filter(r => !Number.isNaN(r.N));
  return DATASET;
}

// Simple KNN (k=5) on normalized features
function recommendCrop(input) {
  const data = loadDatasetOnce();
  if (!data.length) return [];
  const features = ['N','P','K','temperature','humidity','ph','rainfall'];
  // compute min/max for normalization
  const mins = {}, maxs = {};
  features.forEach(f => {
    mins[f] = Math.min(...data.map(d => d[f]));
    maxs[f] = Math.max(...data.map(d => d[f]));
  });
  const norm = (f, v) => {
    const den = (maxs[f] - mins[f]) || 1;
    return (v - mins[f]) / den;
  };
  const vecIn = features.map(f => norm(f, Number(input[f])));
  const distances = data.map(d => {
    const vecD = features.map(f => norm(f, d[f]));
    const dist = Math.sqrt(vecD.reduce((acc, v, i) => acc + Math.pow(v - vecIn[i], 2), 0));
    return { label: d.label, dist };
  });
  distances.sort((a,b) => a.dist - b.dist);
  const k = Math.min(5, distances.length);
  const top = distances.slice(0, k);
  const counts = top.reduce((m, r) => { m[r.label] = (m[r.label]||0)+1; return m; }, {});
  const ranked = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([label,score])=>({ label, score }));
  return ranked;
}

exports.recommend = async (req, res) => {
  try {
    const { N, P, K, temperature, humidity, ph, rainfall } = req.body || {};
    const required = { N, P, K, temperature, humidity, ph, rainfall };
    const missing = Object.entries(required).filter(([,v]) => v === undefined || v === null || v === '').map(([k])=>k);
    if (missing.length) return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });

    const ranked = recommendCrop(required);
    if (!ranked.length) return res.status(500).json({ message: 'Dataset unavailable or empty' });

    return res.json({
      input: required,
      recommendations: ranked,
      top: ranked[0]?.label || null
    });
  } catch (err) {
    console.error('Crop recommend error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};










