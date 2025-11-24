import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, FileText, Sparkles } from 'lucide-react';
import { getAiCoaching, getWeeklyAnalysis } from '../services/geminiService';
import { UserProgress } from '../types';

interface AICoachProps {
  progress: UserProgress;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export const AICoach: React.FC<AICoachProps> = ({ progress }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "I am your Project 50 accountability coach. What do you need help with today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const aiResponse = await getAiCoaching(progress, userMsg);
    
    setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    setLoading(false);
  };

  const handleWeeklyReview = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setMessages(prev => [...prev, { role: 'user', content: "Generate my Weekly Review." }]);
    
    const analysis = await getWeeklyAnalysis(progress);
    
    setMessages(prev => [...prev, { role: 'ai', content: analysis }]);
    setAnalyzing(false);
  }

  return (
    <div className="flex flex-col h-[600px] bg-surface border border-zinc-800 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Coach Gemini</h3>
            <p className="text-xs text-zinc-500">Powered by Gemini 2.5 Flash</p>
          </div>
        </div>
        
        <button 
          onClick={handleWeeklyReview}
          disabled={analyzing}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Weekly Review
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`
                max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-line
                ${msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'}
              `}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl rounded-bl-none p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              <span className="text-xs text-zinc-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask for advice, workout tips, or motivation..."
            className="flex-1 bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-xl transition-colors text-white"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};