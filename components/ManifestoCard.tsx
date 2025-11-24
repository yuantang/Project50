import React, { useState, useEffect } from 'react';
import { Quote, Edit2, Check, Sparkles, Loader2 } from 'lucide-react';
import { refineManifesto } from '../services/geminiService';

interface ManifestoCardProps {
  text: string;
  onSave: (text: string) => void;
}

export const ManifestoCard: React.FC<ManifestoCardProps> = ({ text, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text);
  const [isRefining, setIsRefining] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setValue(text);
  }, [text]);

  const handleSave = () => {
    onSave(value);
    setIsEditing(false);
  };

  const handleRefine = async () => {
    if (!value.trim() || isRefining) return;
    setIsRefining(true);
    const polished = await refineManifesto(value);
    setValue(polished);
    setIsRefining(false);
  };

  if (!text && !isEditing) {
    return (
      <div 
        onClick={() => setIsEditing(true)}
        className="mb-8 p-6 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-900/50 transition-colors group"
      >
        <Quote className="text-zinc-600 mb-2 group-hover:text-emerald-500 transition-colors" size={24} />
        <p className="text-zinc-400 font-medium">Write your Manifesto</p>
        <p className="text-xs text-zinc-600 mt-1">Define your "Why". Why are you doing this?</p>
      </div>
    );
  }

  return (
    <div className="relative mb-8 p-6 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 shadow-lg shadow-black/50 group">
      <Quote className="absolute top-4 left-4 text-zinc-800" size={40} />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">My Pledge</h3>
          <div className="flex gap-2">
            {isEditing && (
              <button
                onClick={handleRefine}
                disabled={isRefining || !value.trim()}
                className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 text-xs px-2 py-1 bg-purple-500/10 rounded-md border border-purple-500/20"
                title="Refine with AI"
              >
                {isRefining ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                <span>AI Polish</span>
              </button>
            )}
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              {isEditing ? <Check size={16} className="text-emerald-500" /> : <Edit2 size={14} />}
            </button>
          </div>
        </div>

        {isEditing ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-black/40 border border-zinc-700 rounded-lg p-3 text-zinc-200 text-lg font-serif italic leading-relaxed focus:outline-none focus:border-emerald-500/50 min-h-[100px]"
            placeholder="I commit to..."
            autoFocus
          />
        ) : (
          <p className="text-lg md:text-xl font-serif italic text-zinc-300 leading-relaxed">
            "{value}"
          </p>
        )}
      </div>
    </div>
  );
};