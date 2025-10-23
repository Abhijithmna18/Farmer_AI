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

// Helper: identify plant using Ollama Vision model (e.g., llava) via /api/chat
async function identifyPlantWithOllama(imagePath) {
  const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_VISION_MODEL || 'llava:latest';
  
  // Read image and detect mime
  const buffer = await fs.readFile(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  let mime = 'image/jpeg';
  if (ext === '.png') mime = 'image/png';
  else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
  else if (ext === '.webp') mime = 'image/webp';
  else if (ext === '.gif') mime = 'image/gif';
  const b64 = buffer.toString('base64');

  const prompt = `Identify the plant in the image and return STRICT JSON with keys:\n` +
    `name, scientificName, growthTime, climate, season, uses (array of strings), shortDescription.\n` +
    `If a field is unknown, set it to null (or [] for uses). Respond with JSON only.`;

  // Use the modern chat API endpoint
  const url = `${base}/api/chat`;
  const body = {
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
        // Ollama expects raw base64 without the data: prefix
        images: [b64]
      }
    ],
    stream: false,
    options: {
      temperature: 0.2,
      top_p: 0.9,
    }
  };

  // Small retry to reduce transient ECONNRESET
  let lastErr = null;
  for (let i = 0; i < 2; i++) {
    try {
      const resp = await axios.post(url, body, { 
        timeout: 120_000, 
        maxContentLength: Infinity, 
        maxBodyLength: Infinity 
      });
      
      // Extract response from the new chat format
      const text = resp.data?.message?.content || resp.data?.response || '';

      // Robust JSON extraction
      let parsed = null;
      try {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
          // Validate that we have at least a name
          if (parsed && parsed.name && parsed.name.trim() !== '') {
            console.log(`Successfully identified plant using Ollama model: ${model}`);
            return { raw: text, data: parsed };
          }
        }
      } catch (parseErr) {
        console.warn(`Failed to parse JSON from Ollama model ${model}:`, parseErr.message);
        console.warn('Raw response:', text);
      }

      // If we got here, the response wasn't valid JSON or missing name
      console.warn(`Ollama model ${model} returned invalid JSON or missing name:`, text);
      
    } catch (e) {
      lastErr = e;
      console.warn(`Ollama attempt ${i + 1} failed:`, e.response?.status, e.message);
      
      // Handle specific error cases
      if (e.response?.status === 400) {
        console.warn('Ollama 400 error - check model availability and image format');
        // Don't retry on 400 errors
        break;
      }
      
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw lastErr || new Error('Ollama request failed');
}

// Helper: identify plant using Google Gemini Vision via REST with model fallbacks
async function identifyPlantWithGemini(imagePath) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment');
  }

  // Read image as base64 and detect mime
  const buffer = await fs.readFile(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  let mime = 'image/jpeg';
  if (ext === '.png') mime = 'image/png';
  else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
  else if (ext === '.webp') mime = 'image/webp';
  else if (ext === '.gif') mime = 'image/gif';
  const b64 = buffer.toString('base64');

  // Enhanced prompt for better plant identification
  const systemPrompt = `You are a plant identification expert. Analyze the plant in the image and provide detailed information in STRICT JSON format with these exact keys:
  - name: Common name of the plant
  - scientificName: Scientific binomial name (genus species)
  - growthTime: Time to maturity (e.g., "90-120 days", "Annual", "Perennial")
  - climate: Suitable climate zones (e.g., "Tropical", "Temperate", "Subtropical")
  - season: Best planting season (e.g., "Spring", "Summer", "All year")
  - uses: Array of uses (e.g., ["Food", "Medicine", "Ornamental"])
  - shortDescription: Brief description of the plant

  If any field is unknown, set it to null (or [] for uses). Return ONLY valid JSON without any additional text or markdown formatting.`;

  const params = { key: process.env.GEMINI_API_KEY };
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemPrompt },
          {
            inline_data: {
              mime_type: mime,
              data: b64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1, // Lower temperature for more consistent results
      maxOutputTokens: 1024,
      topP: 0.8,
      topK: 40,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH", 
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  };

  // Try multiple supported models for image input, prioritizing vision models
  const models = [
    'gemini-1.5-flash', // Most reliable for vision tasks
    'gemini-1.5-pro',   // High quality
    'gemini-pro-vision', // Legacy vision model
    'gemini-pro',       // Fallback text model
    process.env.GEMINI_IMAGE_MODEL
  ].filter(Boolean);

  let lastError = null;
  for (const model of models) {
    try {
      // Use v1beta for better compatibility
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const resp = await axios.post(url, body, { params, timeout: 60000 });
      
      // Check for blocked content or other issues
      if (!resp.data.candidates || resp.data.candidates.length === 0) {
        console.warn(`Gemini model ${model} returned no candidates:`, resp.data);
        continue;
      }

      const candidate = resp.data.candidates[0];
      if (candidate.finishReason === 'SAFETY') {
        console.warn(`Gemini model ${model} blocked content for safety`);
        continue;
      }

      const parts = candidate?.content?.parts || [];
      const text = parts.map((p) => p.text || '').join('\n').trim();

      if (!text) {
        console.warn(`Gemini model ${model} returned empty text`);
        continue;
      }

      // Try to extract JSON from the model response
      let parsed = null;
      try {
        // Look for JSON block in the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
          
          // Validate that we have at least a name
          if (parsed && parsed.name && parsed.name.trim() !== '') {
            console.log(`Successfully identified plant using Gemini model: ${model}`);
            return { raw: text, data: parsed };
          }
        }
      } catch (parseErr) {
        console.warn(`Failed to parse JSON from Gemini model ${model}:`, parseErr.message);
        console.warn('Raw response:', text);
      }

      // If we got here, the response wasn't valid JSON
      console.warn(`Gemini model ${model} returned invalid JSON:`, text);
      
    } catch (err) {
      lastError = err;
      const info = {
        model,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
      };
      console.error('Gemini Vision attempt failed:', info);
      
      // Continue to next model unless it's a critical error
      if (err.response?.status === 403) {
        console.error('Gemini API access forbidden - check API key and billing');
        break;
      } else if (err.response?.status === 429) {
        console.error('Gemini API rate limit exceeded');
        break;
      } else if (err.response?.status !== 404 && err.response?.status !== 400) {
        // For non-404/400 errors, continue trying other models
        continue;
      }
    }
  }
  
  // If we get here, all attempts failed
  if (lastError) {
    console.error('All Gemini model attempts failed. Last error:', lastError.message);
    throw new Error(`Gemini plant identification failed: ${lastError.message}`);
  }
  
  return { raw: '', data: null };
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

// Helper: get plant details from text using Gemini
async function getPlantDetailsFromText(plantName) {
  if (!plantName || typeof plantName !== 'string') {
    return { raw: '', data: null };
  }

  const prompt = `You are a botanical expert. Provide detailed information about the plant "${plantName.trim()}" in STRICT JSON format with these exact keys:
  - name: Common name of the plant
  - scientificName: Scientific binomial name (genus species)
  - growthTime: Time to maturity (e.g., "90-120 days", "Annual", "Perennial")
  - climate: Suitable climate zones (e.g., "Tropical", "Temperate", "Subtropical")
  - season: Best planting season (e.g., "Spring", "Summer", "All year")
  - uses: Array of uses (e.g., ["Food", "Medicine", "Ornamental"])
  - shortDescription: Brief description of the plant

  If any field is unknown, set it to null (or [] for uses). Return ONLY valid JSON without any additional text or markdown formatting.`;

  // 1) Try Ollama text model first if available
  try {
    const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_TEXT_MODEL || 'llama3.1:8b';
    const url = `${base}/api/chat`;
    const body = {
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.9,
      }
    };
    const resp = await axios.post(url, body, { timeout: 60000 });
    const text = resp.data?.message?.content || resp.data?.response || '';
    let parsed = null;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.name) {
          console.log(`Successfully got plant details using Ollama model: ${model}`);
          return { raw: text, data: parsed };
        }
      }
    } catch (_) {}
  } catch (e) {
    console.warn('Ollama text model failed:', e.response?.status, e.message);
    // continue to Gemini below
  }

  // 2) Fallback to Gemini
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set, cannot get plant details');
    return { raw: '', data: null };
  }

  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro', 
    'gemini-pro'
  ];

  let lastError = null;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const params = { key: process.env.GEMINI_API_KEY };
      const body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          topP: 0.8,
          topK: 40,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const resp = await axios.post(url, body, { params, timeout: 30000 });
      
      if (!resp.data.candidates || resp.data.candidates.length === 0) {
        console.warn(`Gemini text model ${model} returned no candidates`);
        continue;
      }

      const candidate = resp.data.candidates[0];
      if (candidate.finishReason === 'SAFETY') {
        console.warn(`Gemini text model ${model} blocked content for safety`);
        continue;
      }

      const parts = candidate?.content?.parts || [];
      const text = parts.map((p) => p.text || '').join('\n').trim();

      if (!text) {
        console.warn(`Gemini text model ${model} returned empty text`);
        continue;
      }

      let parsed = null;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
          if (parsed && parsed.name) {
            console.log(`Successfully got plant details using Gemini model: ${model}`);
            return { raw: text, data: parsed };
          }
        }
      } catch (parseErr) {
        console.warn(`Failed to parse JSON from Gemini text model ${model}:`, parseErr.message);
      }

    } catch (err) {
      lastError = err;
      console.error('Gemini text API request failed:', {
        model,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      if (err.response?.status === 403 || err.response?.status === 429) {
        break; // Don't try other models for auth/rate limit issues
      }
    }
  }

  if (lastError) {
    console.error('All Gemini text model attempts failed:', lastError.message);
  }

  return { raw: '', data: null };
}

// POST /api/plants/upload
// Uses multer upstream to provide req.file
exports.uploadAndIdentify = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    const imagePath = req.file.path; // local path where multer stored the file

    // Initialize identification variables
    let identified = null;
    let raw = null;
    let identificationMethod = 'manual';
    let identificationErrors = [];

    console.log('Starting plant identification process...');

    // 1) Try Gemini Vision first (most reliable)
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('Attempting Gemini Vision identification...');
        const result = await identifyPlantWithGemini(imagePath);
        identified = result.data;
        raw = result.raw;
        if (identified && identified.name && identified.name.trim() !== '') {
          identificationMethod = 'gemini';
          console.log('Successfully identified plant using Gemini Vision:', identified.name);
        } else {
          console.warn('Gemini Vision returned empty or invalid plant name');
          identificationErrors.push('Gemini Vision returned empty plant name');
        }
      } catch (e) {
        const errorMsg = `Gemini Vision failed: ${e.message}`;
        identificationErrors.push(errorMsg);
        console.warn(errorMsg);
        if (e.response?.status === 403) {
          console.error('Gemini API access forbidden - check API key and billing');
        } else if (e.response?.status === 429) {
          console.error('Gemini API rate limit exceeded');
        }
      }
    } else {
      console.warn('GEMINI_API_KEY not set, skipping Gemini Vision');
      identificationErrors.push('Gemini API key not configured');
    }

    // 2) Fallback to Ollama Vision
    if (!identified || !identified.name || identified.name.trim() === '') {
      try {
        console.log('Attempting Ollama Vision identification...');
        const result = await identifyPlantWithOllama(imagePath);
        if (result.data && result.data.name && result.data.name.trim() !== '') {
          identified = result.data;
          raw = result.raw;
          identificationMethod = 'ollama';
          console.log('Successfully identified plant using Ollama Vision:', identified.name);
        } else {
          console.warn('Ollama Vision returned empty or invalid plant name');
          identificationErrors.push('Ollama Vision returned empty plant name');
        }
      } catch (e) {
        const errorMsg = `Ollama Vision failed: ${e.message}`;
        identificationErrors.push(errorMsg);
        console.warn(errorMsg);
        if (e.response?.status === 400) {
          console.warn('Ollama 400 error - check model availability and image format');
        }
      }
    }

    // 3) Fallback to Hugging Face classify
    if ((!identified || !identified.name || identified.name.trim() === '') && process.env.HF_API_TOKEN) {
      try {
        console.log('Attempting Hugging Face classification...');
        const buffer = await fs.readFile(imagePath);
        const model = 'janjibDEV/vit-plantnet300k';
        const hfUrl = `https://api-inference.huggingface.co/models/${model}`;

        const hfResp = await axios.post(hfUrl, buffer, {
          headers: {
            Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
            'Content-Type': 'application/octet-stream',
          },
          timeout: 60000,
        });

        const predictions = hfResp.data; // expected array of { label, score }

        if (predictions && predictions.length > 0) {
          const topPrediction = predictions[0];
          console.log(`HF classified plant as: ${topPrediction.label} (confidence: ${topPrediction.score})`);
          
          identified = { name: topPrediction.label };
          identificationMethod = 'hf';

          // Get full details via text helper (tries Ollama then Gemini)
          try {
            console.log('Fetching detailed information for HF classification...');
            const details = await getPlantDetailsFromText(topPrediction.label);
            if (details.data && details.data.name) {
              identified = { ...details.data, name: topPrediction.label };
              console.log('Successfully enriched HF classification with detailed info');
            }
          } catch (e) {
            console.warn('Failed to enrich HF classification:', e.message);
          }
        } else {
          console.warn('Hugging Face returned no predictions');
          identificationErrors.push('Hugging Face returned no predictions');
        }
      } catch (hfErr) {
        const errorMsg = `Hugging Face classification failed: ${hfErr.message}`;
        identificationErrors.push(errorMsg);
        console.warn(errorMsg);
      }
    } else if (!process.env.HF_API_TOKEN) {
      console.warn('HF_API_TOKEN not set, skipping Hugging Face classification');
      identificationErrors.push('Hugging Face API token not configured');
    }

    // Extract fields with fallbacks
    const name = identified?.name || null;
    const scientificName = identified?.scientificName || null;
    const growthTime = identified?.growthTime || null;
    const climate = identified?.climate || null;
    const season = identified?.season || null;
    const uses = Array.isArray(identified?.uses) ? identified.uses : [];

    // If still unidentified, do not persist; return user-friendly 422
    if (!name || name.trim() === '' || name.toLowerCase().includes('unknown')) {
      try { await fs.unlink(imagePath); } catch (_) {}
      
      // Create detailed error message
      let errorMessage = 'Could not identify the plant from the provided image.';
      
      if (identificationErrors.length > 0) {
        if (identificationErrors.includes('Gemini API key not configured')) {
          errorMessage = 'Plant identification service is not properly configured. Please contact support.';
        } else if (identificationErrors.some(err => err.includes('403'))) {
          errorMessage = 'Plant identification service access denied. Please contact support.';
        } else if (identificationErrors.some(err => err.includes('429'))) {
          errorMessage = 'Plant identification service is temporarily unavailable due to high usage. Please try again later.';
        } else if (identificationErrors.some(err => err.includes('timeout'))) {
          errorMessage = 'Plant identification timed out. The image might be too large or the service is slow. Please try with a smaller image.';
        } else if (identificationErrors.some(err => err.includes('empty plant name'))) {
          errorMessage = 'The AI services could not identify a specific plant from the image. Please try a clearer image or enter details manually.';
        } else {
          errorMessage = 'Plant identification failed. Please try another image or enter details manually.';
        }
      }
      
      return res.status(422).json({
        success: false,
        message: errorMessage,
        identificationMethod,
        errors: identificationErrors,
        modelResponse: raw,
        suggestions: [
          'Try uploading a clearer image of the plant',
          'Ensure the plant is clearly visible in the image',
          'Try different angles or lighting',
          'Enter plant details manually if available'
        ]
      });
    }

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
      identificationMethod,
      shortDescription: identified?.shortDescription || undefined,
      confidence: identificationMethod === 'hf' && identified?.confidence ? identified.confidence : undefined,
      userId: req.user?.id || undefined, // Associate with user if authenticated
    });

    // Create success message based on identification method
    let successMessage = '';
    switch (identificationMethod) {
      case 'gemini':
        successMessage = `Plant identified successfully using Gemini AI: ${name}`;
        break;
      case 'ollama':
        successMessage = `Plant identified successfully using Ollama AI: ${name}`;
        break;
      case 'hf':
        successMessage = `Plant classified successfully using Hugging Face: ${name}`;
        break;
      default:
        successMessage = `Plant uploaded successfully: ${name}. Please edit details if needed.`;
    }

    return res.status(201).json({
      success: true,
      plant: doc,
      enrichment,
      modelResponse: raw,
      identificationMethod,
      message: successMessage,
      confidence: identificationMethod === 'hf' && identified?.confidence ? identified.confidence : null,
      warnings: identificationErrors.length > 0 ? identificationErrors : null
    });
  } catch (err) {
    return next(err);
  }
};

// CRUD: GET /api/plants
exports.getAll = async (req, res, next) => {
  try {
    const { search, method } = req.query;
    let query = {};

    // Add search filter if provided
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { scientificName: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Add identification method filter if provided
    if (method && method.trim()) {
      query.identificationMethod = method.trim();
    }

    // Filter by user if authenticated
    if (req.user?.id) {
      query.$or = [
        { userId: req.user.id },
        { userId: { $exists: false } } // Include plants without userId (legacy)
      ];
    }

    const items = await Plant.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, plants: items });
  } catch (e) { next(e); }
};

// CRUD: POST /api/plants
exports.create = async (req, res, next) => {
  try {
    let data = { ...req.body };

    // Associate with user if authenticated
    if (req.user?.id) {
      data.userId = req.user.id;
    }

    // If only name is provided, try to fetch details
    if (data.name && !data.scientificName && !data.growthTime && !data.climate && !data.season && (!data.uses || data.uses.length === 0)) {
      if (process.env.GEMINI_API_KEY) {
        try {
          const details = await getPlantDetailsFromText(data.name);
          if (details.data) {
            data = { ...data, ...details.data, name: data.name };
          }
        } catch (e) {
          console.warn('Failed to fetch details for create:', e.message);
        }
      }
    }

    const item = await Plant.create(data);
    res.status(201).json({ success: true, plant: item });
  } catch (e) { next(e); }
};

// CRUD: PUT /api/plants/:id
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if plant exists and user has permission
    const existingPlant = await Plant.findById(id);
    if (!existingPlant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    // Check user ownership if authenticated
    if (req.user?.id && existingPlant.userId && existingPlant.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const item = await Plant.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, plant: item });
  } catch (e) { next(e); }
};

// CRUD: DELETE /api/plants/:id
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if plant exists and user has permission
    const existingPlant = await Plant.findById(id);
    if (!existingPlant) {
      return res.status(404).json({ message: 'Plant not found' });
    }

    // Check user ownership if authenticated
    if (req.user?.id && existingPlant.userId && existingPlant.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const item = await Plant.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) { next(e); }
};

// GET /api/plants/details?name=Rose
// Returns enriched details for a plant name without persisting
exports.detailsByName = async (req, res, next) => {
  try {
    const name = (req.query.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Query parameter "name" is required' });

    let details = null;
    if (process.env.GEMINI_API_KEY) {
      try {
        const result = await getPlantDetailsFromText(name);
        if (result.data) details = { ...result.data, name: result.data.name || name };
      } catch (e) {
        // ignore; fall back to minimal info
      }
    }

    // Best-effort enrichment via Wikipedia
    const enrichment = await enrichPlantInfo(details?.name || name).catch(() => ({}));

    return res.json({ success: true, details: details || { name, scientificName: null, growthTime: null, climate: null, season: null, uses: [] }, enrichment });
  } catch (e) { next(e); }
};
