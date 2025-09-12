import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

// Simple glassmorphism floating chatbot
export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom on message update
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Show animated welcome once when opened
  useEffect(() => {
    if (open && !hasWelcomed) {
      setHasWelcomed(true);
      setIsTyping(true);
      const welcome = "Hello! Welcome to AgriGro, your AI-powered farming companion!";
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setMessages([{ role: 'assistant', content: welcome.slice(0, i) }]);
        if (i >= welcome.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [open, hasWelcomed]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const next = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');

    try {
      const res = await axios.post('http://localhost:5000/api/chat', {
        message: trimmed,
        history: messages,
      });
      const reply = res?.data?.reply || 'Sorry, I could not get a response.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error contacting backend. Is the server and Ollama running?' },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        onClick={() => setOpen((o) => !o)}
        className="rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-2xl w-16 h-16 flex items-center justify-center hover:from-green-600 hover:to-teal-600 transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300"
        aria-label={open ? 'Close Chatbot' : 'Open Chatbot'}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
          }}
        >
          {open ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          )}
        </motion.div>
      </motion.button>

      {/* Chat Window */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-3 w-[360px] max-h-[560px] bg-white/10 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="px-4 py-3 flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-medium">
            {/* Floating robot avatar */}
            <motion.div
              aria-hidden
              initial={{ y: 0 }}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shadow-md"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <rect x="5" y="7" width="14" height="10" rx="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="9" cy="12" r="1.5" fill="currentColor" />
                <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                <path d="M8 17c1.333 1 2.667 1 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.div>
            <div className="flex-1">FarmerAI Assistant</div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === 'user'
                    ? 'ml-auto max-w-[80%] rounded-2xl px-3 py-2 bg-green-500/20 text-green-900 dark:text-green-100 backdrop-blur-md border border-white/20 dark:border-white/10'
                    : 'mr-auto max-w-[80%] rounded-2xl px-3 py-2 bg-white/10 dark:bg-gray-800/40 backdrop-blur-md border border-white/20 dark:border-white/10 text-gray-900 dark:text-gray-100'
                }
                aria-live={idx === messages.length - 1 ? 'polite' : undefined}
              >
                {m.content}
                {/* typing dots when welcome typing or backend processing */}
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

          <div className="p-3 border-t border-white/20 dark:border-white/10 bg-white/10 dark:bg-gray-900/30 backdrop-blur">
            <div className="flex items-center gap-2">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 resize-none rounded-xl px-3 py-2 bg-white/10 dark:bg-gray-800/40 border border-white/20 dark:border-white/10 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-600 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button
                onClick={sendMessage}
                className="rounded-xl bg-green-600 text-white px-3 py-2 text-sm hover:bg-green-700 transition"
              >
                Send
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}