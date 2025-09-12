import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { glass } from '../../styles/globalStyles';

// Chatbot screen with Zoiee avatar and welcome animation
export default function ChatbotScreen() {
  const [messages, setMessages] = useState([]); // {role, content}
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!hasWelcomed) {
      setHasWelcomed(true);
      setIsTyping(true);
      const welcome = '🤖 Welcome to AgriGro, your AI-powered farming companion!';
      let i = 0;
      const id = setInterval(() => {
        i++;
        setMessages([{ role: 'assistant', content: welcome.slice(0, i) }]);
        if (i >= welcome.length) {
          clearInterval(id);
          setIsTyping(false);
        }
      }, 30);
      return () => clearInterval(id);
    }
  }, [hasWelcomed]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');

    try {
      const res = await axios.post('http://localhost:5000/api/chat', { message: text, history: messages });
      const reply = res?.data?.reply || 'Sorry, I could not get a response.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error contacting backend. Is the server running?' }]);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-3xl p-6 ${glass.panel}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            aria-hidden
            initial={{ y: 0 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-gray-100"
            title="Zoiee"
          >
            {/* Simple robot head avatar */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <rect x="5" y="7" width="14" height="10" rx="4" stroke="currentColor" strokeWidth="2" />
              <circle cx="9" cy="12" r="1.5" fill="currentColor" />
              <circle cx="15" cy="12" r="1.5" fill="currentColor" />
              <path d="M8 17c1.333 1 2.667 1 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
          <div className="text-lg font-semibold text-gray-900">Zoiee</div>
        </div>

        <div ref={listRef} className="h-[460px] overflow-y-auto p-3 space-y-2 bg-white/5 rounded-xl border border-white/10">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={
                m.role === 'user'
                  ? `${glass.bubbleUser} ml-auto px-3 py-2 max-w-[80%]`
                  : `${glass.bubbleAssistant} mr-auto px-3 py-2 max-w-[80%]`
              }
              aria-live={idx === messages.length - 1 ? 'polite' : undefined}
            >
              {m.content}
              {idx === messages.length - 1 && isTyping && m.role === 'assistant' && (
                <span className="inline-flex items-center gap-1 ml-2 align-middle" aria-hidden>
                  <span className="w-1.5 h-1.5 bg-current/70 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-current/70 rounded-full animate-bounce [animation-delay:.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-current/70 rounded-full animate-bounce [animation-delay:.3s]"></span>
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message..."
            className={`flex-1 resize-none px-3 py-2 ${glass.input} text-sm placeholder:text-gray-600 dark:placeholder:text-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400`}
          />
          <button onClick={send} className="rounded-xl bg-green-600 text-white px-3 py-2 text-sm hover:bg-green-700 transition">
            Send
          </button>
        </div>
      </motion.div>
    </div>
  );
}