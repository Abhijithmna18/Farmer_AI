// src/controllers/plant.controller.js
// Controller to handle Plant Info Explorer logic: upload -> Ollama -> enrich -> save -> CRUD

const path = require('path');
const fs = require('fs/promises');
const axios = require('axios');
const Plant = require('../models/Plant');
// We'll use the Hugging Face Inference REST API via axios instead of the JS SDK
// to avoid compatibility issues with different SDK exports.
// Ensure HF_API_TOKEN is set in environment.

// POST /api/plants/classify
exports.classifyWithHF = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image file is required (field: plantImage)' });

    const imagePath = req.file.path;
    const buffer = await fs.readFile(imagePath);

    // Call Hugging Face image classification endpoint
    // The Inference.client supports image classification via 'image-classification' task
    // For the JS SDK we can use client.imageClassification or client.post depending on version
    try {
      if (!process.env.HF_API_TOKEN) {
        try { await fs.unlink(imagePath); } catch (er) { /* ignore */ }
        return res.status(400).json({ message: 'HF_API_TOKEN is not set. Please set it in the backend environment.' });
      }
      const model = 'janjibDEV/vit-plantnet300k';
      const hfUrl = `https://api-inference.huggingface.co/models/${model}`;

      const hfResp = await axios.post(hfUrl, buffer, {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        },
        timeout: 60_000,
      });

      const predictions = hfResp.data; // expected array of { label, score }

      // Clean up uploaded file (optional)
      try { await fs.unlink(imagePath); } catch (er) { /* ignore */ }

      return res.json({ success: true, predictions });
    } catch (hfErr) {
      try { await fs.unlink(imagePath); } catch (er) { /* ignore */ }
      // surface more info from axios error if present
      const details = hfErr.response?.data || hfErr.message || hfErr;
      return res.status(502).json({ message: 'Hugging Face inference failed', error: details });
    }
  } catch (e) { next(e); }
};

// Helper: query Gemini API for plant identification
async function identifyPlantWithGemini(imagePath) {
  const prompt = `Identify the plant in this image and return a JSON object with these exact fields:
{
  "name": "Common plant name",
  "scientificName": "Scientific name (Genus species)",
  "growthTime": "Growth duration (e.g., '60-90 days', 'Perennial')",
  "climate": "Climate requirements (e.g., 'Tropical', 'Temperate', 'Warm-season')",
  "season": "Best growing season (e.g., 'Spring', 'Summer', 'Year-round')",
  "uses": ["Use 1", "Use 2", "Use 3"],
  "shortDescription": "Brief description of the plant"
}

If you cannot identify the plant clearly, set fields to null. Be specific and accurate.`;

  // Read file and encode as base64
  const buffer = await fs.readFile(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  let mime = 'image/jpeg';
  if (ext === '.png') mime = 'image/png';
  else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
  else if (ext === '.gif') mime = 'image/gif';
  else if (ext === '.webp') mime = 'image/webp';
  
  const b64 = buffer.toString('base64');

  const resp = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: mime,
            data: b64
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      topK: 32,
      topP: 1,
      maxOutputTokens: 1024,
    }
  }, { timeout: 60_000 });

  const text = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Try to extract JSON from the response
  let parsed = null;
  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    }
  } catch (e) {
    // ignore, we'll fallback
  }

  return {
    raw: text,
    data: parsed || null,
  };
}

// Helper: enrich info via Wikipedia simple fetch (best-effort)
async function enrichPlantInfo(name) {
  if (!name) return {};
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
    const { data } = await axios.get(url, { timeout: 20_000 });
    const summary = data?.extract || '';
    // Very light parsing for additional hints
    return { wikiSummary: summary };
  } catch (e) {
    return {};
  }
}

// POST /api/plants/upload
// Uses multer upstream to provide req.file
exports.uploadAndIdentify = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    const imagePath = req.file.path; // local path where multer stored the file

    // 1) Identify via Gemini API
    let geminiData = null;
    let raw = null;
    try {
      if (!process.env.GEMINI_API_KEY) {
        try { await fs.unlink(imagePath); } catch (er) { /* ignore */ }
        return res.status(400).json({ message: 'GEMINI_API_KEY is not set. Please set it in the backend environment.' });
      }
      const result = await identifyPlantWithGemini(imagePath);
      geminiData = result.data;
      raw = result.raw;
    } catch (e) {
      // attempt to remove uploaded file to avoid accumulation
      try { await fs.unlink(imagePath); } catch (er) { /* ignore */ }
      // surface more info if available
      const status = e.response?.status;
      const body = e.response?.data || e.message;
      return res.status(502).json({ message: 'Failed to identify image via Gemini API', status, body });
    }

    // Extract fields with fallbacks
    const name = geminiData?.name || null;
    const scientificName = geminiData?.scientificName || null;
    const growthTime = geminiData?.growthTime || null;
    const climate = geminiData?.climate || null;
    const season = geminiData?.season || null;
    const uses = Array.isArray(geminiData?.uses) ? geminiData.uses : [];

    // 2) Enrich via internet (Wikipedia)
    const enrichment = await enrichPlantInfo(name || scientificName);

    // 3) Persist to DB
    const doc = await Plant.create({
      name: name || 'Unknown Plant',
      scientificName: scientificName || undefined,
      growthTime: growthTime || undefined,
      climate: climate || undefined,
      season: season || undefined,
      uses,
      imageUrl: `/plants/uploads/${path.basename(imagePath)}`,
      // Optionally store enrichment fields using separate schema fields if needed
    });

    return res.status(201).json({
      success: true,
      plant: doc,
      enrichment,
      modelResponse: raw,
    });
  } catch (err) {
    return next(err);
  }
};

// CRUD: GET /api/plants
exports.getAll = async (req, res, next) => {
  try {
    const items = await Plant.find().sort({ createdAt: -1 });
    res.json({ success: true, plants: items });
  } catch (e) { next(e); }
};

// CRUD: POST /api/plants
exports.create = async (req, res, next) => {
  try {
    const item = await Plant.create(req.body);
    res.status(201).json({ success: true, plant: item });
  } catch (e) { next(e); }
};

// CRUD: PUT /api/plants/:id
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Plant.findByIdAndUpdate(id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Plant not found' });
    res.json({ success: true, plant: item });
  } catch (e) { next(e); }
};

// CRUD: DELETE /api/plants/:id
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Plant.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: 'Plant not found' });
    res.json({ success: true });
  } catch (e) { next(e); }
};