import React, { useState, useEffect } from 'react';
import { Pencil, Check, Sparkles, Loader2, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { refineManifesto } from '../services/geminiService';

interface DailyFocusCardProps {
  manifesto: string;
  onSaveManifesto: (text: string) => void;
  isPerfectDay?: boolean;
}

export const DailyFocusCard: React.FC<DailyFocusCardProps> = ({ 
  manifesto, 
  onSaveManifesto,
  isPerfectDay
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(manifesto);
  const [isRefining, setIsRefining] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setValue(manifesto);
  }, [manifesto]);

  const handleSave = () => {
    onSaveManifesto(value);
    setIsEditing(false);
  };

  const handleRefine = async () => {
    if (!value.trim() || isRefining) return;
    setIsRefining(true);
    const polished = await refineManifesto(value);
    setValue(polished);
    setIsRefining(false);
  };

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border transition-all duration-500 backdrop-blur-xl
      ${isPerfectDay 
        ? 'bg-gradient-to-br from-emerald-950/40 to-black/60 border-emerald-500/50 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]' 
        : 'bg-gradient-to-br from-zinc-900/60 to-black/80 border-white/5'}
    `}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      {/* Main Content Container */}
      <div className="relative z-10 p-5">
        
        {/* Header Row: Title & Controls */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={14} className={isPerfectDay ? "text-emerald-400" : "text-indigo-400"} />
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">My North Star</h3>
            </div>
            
            <div className="flex gap-2 items-center">
               {isEditing && (
                <button
                  onClick={handleRefine}
                  disabled={isRefining || !value.trim()}
                  className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 text-[10px] px-2 py-1 bg-purple-500/10 rounded-md border border-purple-500/20"
                >
                  {isRefining ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  <span>AI Polish</span>
                </button>
              )}
              <button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="text-zinc-500 hover:text-white transition-colors p-1"
              >
                {isEditing ? <Check size={14} className="text-emerald-500" /> : <Pencil size={12} />}
              </button>
            </div>
        </div>

        {/* Manifesto Body */}
        <div>
          {isEditing ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full bg-black/40 border border-zinc-700 rounded-lg p-3 text-zinc-200 text-sm font-serif italic leading-relaxed focus:outline-none focus:border-indigo-500/50 min-h-[100px]"
              placeholder="I commit to..."
              autoFocus
            />
          ) : (
            <div className="relative group">
               {!value ? (
                 <div onClick={() => setIsEditing(true)} className="cursor-pointer text-zinc-500 italic text-sm border border-dashed border-zinc-800 rounded-lg p-3 text-center hover:bg-zinc-900 transition-colors">
                   Define your "Why". Click to write your manifesto.
                 </div>
               ) : (
                 <div onClick={() => setIsExpanded(!isExpanded)} className="cursor-pointer">
                    <p className={`
                        text-base md:text-lg font-serif italic text-zinc-200 leading-relaxed tracking-wide opacity-90 transition-all
                        ${isExpanded ? '' : 'line-clamp-3'}
                    `}>
                      "{value}"
                    </p>
                    {/* Expand/Collapse Hint */}
                    {value.length > 150 && (
                        <div className="flex justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isExpanded ? <ChevronUp size={12} className="text-zinc-600" /> : <ChevronDown size={12} className="text-zinc-600" />}
                        </div>
                    )}
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};