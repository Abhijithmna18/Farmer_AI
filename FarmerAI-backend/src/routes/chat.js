// src/routes/chat.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Ensure data directory exists for simple local persistence
const dataDir = path.join(__dirname, '..', '..', 'data');
const chatsFile = path.join(dataDir, 'chats.json');

async function ensureDataFile() {
  await fs.promises.mkdir(dataDir, { recursive: true });
  try {
    await fs.promises.access(chatsFile, fs.constants.F_OK);
  } catch {
    await fs.promises.writeFile(chatsFile, JSON.stringify([]), 'utf8');
  }
}

async function appendChatRecord(record) {
  try {
    await ensureDataFile();
    const raw = await fs.promises.readFile(chatsFile, 'utf8');
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(record);
    await fs.promises.writeFile(chatsFile, JSON.stringify(arr, null, 2), 'utf8');
  } catch (err) {
    // Non-blocking persistence; log to console to avoid route failure
    console.error('Chat persistence error:', err.message);
  }
}

// POST /api/chat
// Body: { message: string, history?: { role: 'user'|'assistant', content: string }[] }
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build a simple prompt from history + current message
    const historyText = history
      .slice(-10)
      .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`)
      .join('\n');

    const systemPreamble =
      'You are FarmerAI, a helpful agricultural assistant for farmers. ' +
      'Be concise and practical. If users ask about registration, onboarding, recommendations, or reports, guide them clearly.';

    const prompt = [systemPreamble, historyText, `User: ${message}`, 'Assistant:'].filter(Boolean).join('\n');

    // Call local Ollama (llama3) - requires Ollama running locally
    const ollamaUrl = 'http://localhost:11434/api/generate';

    // Use Node.js native fetch (Node >= 18)
    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3',
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
        },
      }),
      // optional timeout pattern could be added with AbortController if needed
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: 'Ollama error', details: text });
    }

    const data = await response.json();
    const reply = data?.response || '';

    // Persist chat minimally for later PDF/report generation
    appendChatRecord({
      timestamp: new Date().toISOString(),
      message,
      reply,
    }).catch(() => {});

    return res.json({ reply });
  } catch (err) {
    console.error('Chat route error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;