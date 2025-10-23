const { fetch } = require('undici');

const API_BASE = 'https://generativelanguage.googleapis.com/v1';

// Try multiple model IDs to avoid NOT_FOUND across regions/versions
const DEFAULT_MODELS = [
  // Environment-configurable preferred model first
  process.env.GEMINI_MODEL,
  // Current viable models (v1)
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  // Older/legacy fallbacks
  'gemini-pro',
  'gemini-pro-vision',
].filter(Boolean);

async function tryModel(model, body, apiKey) {
  const url = `${API_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text();
    const err = new Error(`Gemini error: ${res.status} ${errText}`);
    err.status = res.status;
    err.raw = errText;
    throw err;
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || 'No response';
  return text;
}

async function askGemini(prompt, language = 'en', apiKey = process.env.GEMINI_API_KEY) {
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  // Prepend language instruction for better responses
  const systemPrompt = `Reply in ${language} language (en=English, hi=Hindi, ml=Malayalam, ta=Tamil). Be concise and actionable for farmers.`;

  const body = {
    contents: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'user', parts: [{ text: prompt }] }
    ]
  };

  const models = DEFAULT_MODELS.length ? DEFAULT_MODELS : ['gemini-pro'];
  const errors = [];
  for (const model of models) {
    try {
      return await tryModel(model, body, apiKey);
    } catch (e) {
      errors.push(`[${model}] -> ${e.message}`);
      // If NOT_FOUND (404), try next; otherwise break on 4xx/5xx except 404
      if (e.status && e.status !== 404) {
        break;
      }
    }
  }
  throw new Error(`All Gemini model attempts failed. Tried: ${models.join(', ')}. Errors: ${errors.join(' | ')}`);
}

module.exports = { askGemini };














