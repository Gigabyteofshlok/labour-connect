// FLOATING AI CHATBOT ASSISTANT WIDGET
// Serves as an omnipresent smart overlay on all dashboards. Connects with backend NLP generators.

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { 
  MessageSquare, X, Send, Sparkles, HelpCircle, ShieldAlert, BookOpen, AlertCircle
} from 'lucide-react';

const SHORTCUTS = [
  { text: "Verify UPI PIN Safety", prompt: "Tell me about UPI scams and PIN safety" },
  { text: "Explain e-Shram Scheme", prompt: "What are e-Shram card benefits?" },
  { text: "How to save ₹500/mo?", prompt: "Give me micro-savings advice" }
];

const AIAssistantWidget = () => {
  const { isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: "Namaste! Hello! I am your Labour Connect AI Assistant. Ask me anything about digital payment safety, government welfare schemes, or micro-savings!" 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  // Do not render AI helper if user is not authenticated
  if (!isAuthenticated) return null;

  const handleSendMessage = async (msgText) => {
    const textToSend = msgText || inputText;
    if (!textToSend.trim()) return;

    // Append client message
    const userMsg = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat', { message: textToSend });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "I am having trouble reaching the AI core. Make sure your server is online, or proceed with standard welfare/banking calculators." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 text-left font-sans">
      
      {/* FLOATING ACTION TRIGGER TRIGGER */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-orange-gradient text-white neon-glow-orange flex items-center justify-center shadow-2xl relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="flex items-center justify-center">
              <MessageSquare className="w-6 h-6 absolute" />
              <Sparkles className="w-3.5 h-3.5 absolute -top-1.5 -right-1 text-yellow-300 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* CHAT DISPLAY DRAWER PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 h-[480px] glass-panel rounded-3xl border-white/10 shadow-2xl flex flex-col overflow-hidden bg-dark-950/80 backdrop-blur-lg"
          >
            
            {/* PANEL HEADER */}
            <div className="bg-white/5 border-b border-white/5 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500">
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-white">Labour Connect AI Advisor</span>
                  <span className="text-[10px] text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-active" /> Bilingual Assistant Active
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/5 rounded-lg text-dark-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MESSAGES LOG VIEW */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 text-xs text-left">
              {messages.map((m, idx) => {
                const isUser = m.role === 'user';
                return (
                  <div 
                    key={idx} 
                    className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto text-right items-end' : 'mr-auto text-left items-start'}`}
                  >
                    <span className="text-[9px] text-dark-400 font-bold mb-0.5">
                      {isUser ? 'You' : 'AI Assistant'}
                    </span>
                    <div className={`p-3 rounded-2xl leading-relaxed font-semibold ${isUser ? 'bg-brand-500 text-white rounded-tr-none' : 'bg-white/5 border border-white/5 text-white rounded-tl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                );
              })}
              
              {/* Thinking loader */}
              {loading && (
                <div className="flex flex-col max-w-[85%] mr-auto items-start">
                  <span className="text-[9px] text-dark-400 font-bold mb-0.5">AI Assistant</span>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-75" />
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* HELPFUL QUICK SHORTCUTS */}
            <div className="px-4 pb-2 border-t border-white/5 pt-3">
              <span className="text-[9px] text-dark-400 font-bold uppercase tracking-wider block mb-1.5">Recommended Help:</span>
              <div className="flex flex-wrap gap-1.5">
                {SHORTCUTS.map(sc => (
                  <button
                    key={sc.text}
                    onClick={() => handleSendMessage(sc.prompt)}
                    className="py-1 px-2.5 bg-white/5 border border-white/5 hover:border-brand-500/10 text-white text-[10px] rounded-lg transition-colors font-semibold"
                  >
                    {sc.text}
                  </button>
                ))}
              </div>
            </div>

            {/* CHAT INPUT CONTAINER */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-dark-950/60 border-t border-white/5 flex gap-2"
            >
              <input 
                type="text" 
                placeholder="Ask me a question in Eng / Hindi / Marathi..." 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="flex-1 glass-input px-3.5 py-2.5 rounded-xl text-xs"
              />
              <button 
                type="submit"
                className="bg-brand-500 text-white p-2.5 rounded-xl hover:bg-brand-600 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AIAssistantWidget;
