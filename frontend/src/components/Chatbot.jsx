import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, TrendingUp, Search, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:8080/api';

const QUICK_ACTIONS = [
  { label: "Trending", icon: <TrendingUp style={{ width: 14, height: 14 }} />, prompt: "What's trending this week?" },
  { label: "Top Rated", icon: <Sparkles style={{ width: 14, height: 14 }} />, prompt: "Show me some of the best movies of all time" },
  { label: "Sci-Fi Picks", icon: <Film style={{ width: 14, height: 14 }} />, prompt: "Recommend some science fiction movies" },
  { label: "Horror", icon: <Search style={{ width: 14, height: 14 }} />, prompt: "Found any good scary movies recently?" },
];

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hi! I'm your **Moventia AI Assistant**. 🎬\n\nI can help you find movies, get recommendations, or answer questions about films. What are you in the mood for?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text = inputValue) => {
    const messageText = typeof text === 'string' ? text : inputValue;
    if (!messageText.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Send conversation history for context-based chat
      const currentHistory = [...messages, userMessage].filter(m => m.text && m.sender);
      
      const res = await fetch(`${API_URL}/chatbot`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: messageText, history: currentHistory }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, {
          id: data.id,
          text: data.text,
          sender: 'bot',
          timestamp: new Date(data.timestamp),
        }]);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Chatbot API Error:', res.status, errorData);
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }
    } catch (err) {
      console.error('Chatbot Connection/Parse Error:', err);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: `**Connection Error**: ${err.message || "I'm having trouble connecting to my movie database."} 🍿`,
        sender: 'bot',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="mb-2"
            style={{ width: 640, maxWidth: 'calc(100vw - 32px)' }}
          >
            {/* 
              Use a plain div instead of Card to avoid the global [data-slot='card'] 
              styles that may interfere with fixed sizing.
            */}
            <div
              style={{
                height: 600,
                maxHeight: 'calc(100vh - 120px)',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid rgba(200, 168, 109, 0.2)',
                background: 'linear-gradient(145deg, rgba(16, 25, 39, 0.96), rgba(11, 18, 31, 0.94))',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                backdropFilter: 'blur(24px)',
              }}
            >

              {/* Messages Area — plain scrollable div with fixed flex behavior */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  padding: '16px',
                  minHeight: 0, /* critical for flex children to not expand */
                }}
                className="chatbot-messages-scroll"
              >
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-white/5 border border-white/8 rounded-tl-sm text-foreground'
                        }`}
                      >
                        <div className="prose prose-sm dark:prose-invert break-words text-inherit leading-snug text-[11px]">
                          <ReactMarkdown
                            components={{
                              a: ({ node, ...props }) => {
                                if (props.href && props.href.startsWith('/movie/')) {
                                  return (
                                    <Link to={props.href} className="text-primary hover:text-primary/80 underline font-semibold transition-colors" onClick={() => setIsOpen(false)}>
                                      {props.children}
                                    </Link>
                                  );
                                }
                                return <a target="_blank" rel="noopener noreferrer" {...props} className="text-primary hover:underline" />;
                              }
                            }}
                          >
                            {message.text}
                          </ReactMarkdown>
                        </div>
                        <p className={`text-[8px] mt-1 opacity-50 font-medium ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-2 items-center px-2 py-1">
                        <div className="flex gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                        </div>
                        <span className="text-[9px] text-muted-foreground font-medium ml-1 italic">Thinking...</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Footer / Input Area */}
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(0,0,0,0.15)',
                  flexShrink: 0,
                }}
              >
                {/* Quick Actions */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleSend(action.prompt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.55)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          lineHeight: 1.2,
                        }}
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Input
                      placeholder="Type a message..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      disabled={loading}
                      style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', borderRadius: 8, boxShadow: 'none', height: 36, fontSize: 13, color: 'white', outline: 'none', width: '100%', padding: '0 10px' }}
                      className="focus-visible:ring-0"
                    />
                  </div>
                  <Button 
                    onClick={() => handleSend()} 
                    size="icon" 
                    disabled={loading || !inputValue.trim()}
                    className="h-8 w-8 shrink-0 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          style={{ 
            height: 56, width: 56, borderRadius: '50%', padding: 0, overflow: 'hidden',
            background: isOpen ? '#b33939' : undefined,
          }}
          className={`shadow-2xl transition-all duration-500 ring-4 ring-black/40 ${
            isOpen ? 'hover:bg-destructive' : 'bg-primary hover:bg-primary/90'
          }`}
        >
          <div className="flex items-center justify-center h-full w-full">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                >
                  <X className="h-6 w-6 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="relative flex items-center justify-center"
                >
                  <MessageSquare className="h-6 w-6 text-white" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full border-2 border-black animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Button>
      </motion.div>
    </div>
  );
}
