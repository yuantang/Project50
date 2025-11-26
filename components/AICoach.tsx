
import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, Sparkles, X, User } from 'lucide-react';
import { getAiCoaching, getWeeklyAnalysis } from '../services/geminiService';
import { UserProgress } from '../types';

interface AICoachProps {
  progress: UserProgress;
  onClose?: () => void; // Optional if used in modal
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export const AICoach: React.FC<AICoachProps> = ({ progress, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "I am your accountability coach. What's on your mind? I can help with motivation, strategy, or tough love." }
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

  // Enhanced Markdown Parser
  const formatMessage = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
        const trimmed = line.trim();
        
        // H3 Headers (###)
        if (trimmed.startsWith('### ')) {
            return <h3 key={i} className="text-indigo-300 font-bold uppercase tracking-wider text-xs mt-3 mb-1">{trimmed.substring(4)}</h3>;
        }
        // H2 Headers (##)
        if (trimmed.startsWith('## ')) {
            return <h2 key={i} className="text-white font-bold text-sm mt-4 mb-2 border-b border-indigo-500/30 pb-1">{trimmed.substring(3)}</h2>;
        }

        // List Items (Bullets)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
           const cleanLine = trimmed.substring(2);
           const bolded = cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
           return <li key={i} className="ml-4 list-disc marker:text-indigo-500 pl-1 mb-1 text-zinc-300" dangerouslySetInnerHTML={{ __html: bolded }} />;
        }
        
        // List Items (Numbered 1. 2.)
        if (/^\d+\.\s/.test(trimmed)) {
            const cleanLine = trimmed.replace(/^\d+\.\s/, '');
            const bolded = cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
            return <div key={i} className="flex gap-2 mb-2 ml-1">
                <span className="text-indigo-400 font-bold text-xs mt-0.5">{trimmed.match(/^\d+/)?.[0]}.</span>
                <span className="text-zinc-300" dangerouslySetInnerHTML={{ __html: bolded }} />
            </div>;
        }

        // Empty Lines
        if (!trimmed) {
            return <div key={i} className="h-2" />;
        }
        
        // Regular Text (with bold support)
        const bolded = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>');
        return <p key={i} className="text-zinc-300 min-h-[1.2em]" dangerouslySetInnerHTML={{ __html: bolded }} />;
    });
  };

  return (
    <div className="flex flex-col h-[600px] bg-zinc-950 text-white relative">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md flex items-center justify-between shrink-0 absolute top-0 left-0 right-0 z-10 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Coach Gemini</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-zinc-400 font-medium">Online</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleWeeklyReview}
            disabled={analyzing}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 text-[10px] font-bold transition-colors disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-indigo-400" />}
            <span className="hidden sm:inline">Weekly Review</span>
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pt-20 pb-4 px-4 space-y-6 custom-scrollbar bg-black/40">
        {messages.map((msg, idx) => {
           const isUser = msg.role === 'user';
           return (
            <div 
              key={idx} 
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto overflow-hidden ${isUser ? 'bg-zinc-800' : 'bg-indigo-900/30 border border-indigo-500/30'}`}>
                 {isUser ? (
                    progress.avatar ? (
                      <img src={progress.avatar} alt="Me" className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className="text-zinc-400" />
                    )
                 ) : (
                    <Bot size={14} className="text-indigo-400" />
                 )}
              </div>

              <div 
                className={`
                  max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm
                  ${isUser 
                    ? 'bg-zinc-800 text-white rounded-br-none border border-zinc-700' 
                    : 'bg-indigo-950/20 text-indigo-50 rounded-bl-none border border-indigo-500/10'}
                `}
              >
                {isUser ? (
                  <p>{msg.content}</p>
                ) : (
                  <div className="space-y-0.5">
                    {formatMessage(msg.content)}
                  </div>
                )}
              </div>
            </div>
           )
        })}
        
        {loading && (
          <div className="flex justify-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-900/30 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-auto">
               <Bot size={14} className="text-indigo-400" />
            </div>
            <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
              <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900 shrink-0">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-900 transition-all placeholder:text-zinc-600"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-1.5 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-0 disabled:scale-90 rounded-lg transition-all text-white shadow-lg shadow-indigo-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 text-center mt-2">AI can make mistakes. Trust your discipline.</p>
      </div>
    </div>
  );
};
