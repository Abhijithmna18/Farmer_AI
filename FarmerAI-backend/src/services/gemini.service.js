const fetch = require('node-fetch');

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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

  const url = `${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini error: ${res.status} ${errText}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || 'No response';
  return text;
}

module.exports = { askGemini };














