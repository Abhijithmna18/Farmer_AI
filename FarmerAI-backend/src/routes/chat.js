// src/routes/chat.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { askGemini } = require('../services/gemini.service');

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
// Body: { message: string, history?: { role: 'user'|'assistant', content: string }[], language?: string }
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], language = 'en' } = req.body || {};
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
    
    // Use Gemini to generate the assistant reply
    const reply = await askGemini(prompt, language);

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