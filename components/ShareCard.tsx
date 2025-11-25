
import React, { useState } from 'react';
import { UserProgress } from '../types';
import { Trophy, CircleCheck, Calendar, Quote, Copy, Check, AlignJustify, Layout } from 'lucide-react';
import { LongShare } from './LongShare';

interface ShareCardProps {
  progress: UserProgress;
  onClose: () => void;
}

export const ShareCard: React.FC<ShareCardProps> = ({ progress, onClose }) => {
  const [mode, setMode] = useState<'daily' | 'long'>('daily');
  const [copied, setCopied] = useState(false);
  
  const currentDay = progress.currentDay;
  const habitsCount = progress.customHabits.length;
  
  // Calculate completed habits for the current day
  const todayData = progress.history[currentDay] || { completedHabits: [], photo: undefined, notes: '' };
  const completedCount = todayData.completedHabits.length;
  const percentage = Math.round((completedCount / habitsCount) * 100);
  const hasPhoto = !!todayData.photo;

  const handleCopyText = () => {
    const lines = [
      `🚀 PROJECT ${progress.totalDays} UPDATE`,
      `📅 Day ${currentDay}/${progress.totalDays}`,
      `✅ Progress: ${percentage}%`,
      ``,
      ...progress.customHabits.map(h => {
        const isDone = todayData.completedHabits.includes(h.id);
        return `${isDone ? '✅' : '⬜'} ${h.label}`;
      }),
      ``,
      todayData.notes ? `📝 "${todayData.notes}"` : '',
      `#Project50 #Discipline`
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`relative w-full ${mode === 'long' ? 'max-w-md h-[90vh]' : 'max-w-sm'} rounded-[32px] overflow-hidden shadow-2xl group bg-zinc-900 border border-zinc-800 flex flex-col transition-all duration-500`}>
        
        {/* Header Controls */}
        <div className="absolute top-4 right-4 z-30 flex gap-2">
           <div className="bg-black/40 backdrop-blur-md rounded-full p-1 flex border border-white/10">
              <button 
                onClick={() => setMode('daily')}
                className={`p-2 rounded-full transition-all ${mode === 'daily' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                title="Daily Card"
              >
                <Layout size={16} />
              </button>
              <button 
                onClick={() => setMode('long')}
                className={`p-2 rounded-full transition-all ${mode === 'long' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                title="Full Report"
              >
                <AlignJustify size={16} />
              </button>
           </div>
           <button 
            onClick={onClose}
            className="p-2.5 bg-black/40 text-white/80 rounded-full hover:bg-black/60 transition-colors backdrop-blur-md border border-white/10"
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
        {mode === 'long' ? (
            <LongShare progress={progress} />
        ) : (
            <div className="relative aspect-[9/16] flex flex-col justify-between h-full">
            {/* Background Image or Gradient */}
            {hasPhoto ? (
                <div className="absolute inset-0 z-0">
                <img src={todayData.photo} alt="Background" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
                </div>
            ) : (
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-emerald-950" />
            )}

            {/* Header */}
            <div className="relative z-10 p-8 pt-10">
                <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Trophy className="text-black w-5 h-5" strokeWidth={3} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white leading-none tracking-tight">PROJECT {progress.totalDays}</h2>
                    <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-1">Daily Check-in</p>
                </div>
                </div>
            </div>

            {/* Stats & Details */}
            <div className="relative z-10 p-8 space-y-6">
                
                {/* Main Big Number */}
                <div>
                <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-white tracking-tighter shadow-black drop-shadow-lg">
                    DAY {currentDay}
                    </span>
                </div>
                <div className="h-1.5 w-24 bg-emerald-500 rounded-full mt-2 shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
                </div>

                {/* Note Snippet */}
                {todayData.notes && (
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <Quote size={16} className="text-emerald-400 mb-2 opacity-80" />
                    <p className="text-sm text-zinc-100 italic line-clamp-3 leading-relaxed font-light">
                    "{todayData.notes}"
                    </p>
                </div>
                )}

                {/* Grid of Habits */}
                <div className="bg-black/40 backdrop-blur-md p-5 rounded-3xl border border-white/5">
                <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-3">
                    <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Progress</div>
                    <div className={`text-xl font-bold ${percentage === 100 ? 'text-emerald-400' : 'text-white'}`}>{percentage}%</div>
                </div>
                <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                    {progress.customHabits.map((h) => {
                    const isDone = todayData.completedHabits.includes(h.id);
                    return (
                        <div key={h.id} className={`flex items-center gap-2 text-xs transition-opacity ${isDone ? 'opacity-100' : 'opacity-40'}`}>
                        <CircleCheck 
                            size={14} 
                            className={isDone ? 'text-emerald-500' : 'text-zinc-500'} 
                            fill={isDone ? 'currentColor' : 'none'}
                            fillOpacity={0.2}
                        />
                        <span className="text-zinc-100 truncate">{h.label}</span>
                        </div>
                    )
                    })}
                </div>
                </div>

                <div className="text-center pt-2">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Keep The Streak Alive</p>
                </div>
            </div>
            </div>
        )}
        </div>

        {/* Copy Text Action (Only for Daily) */}
        {mode === 'daily' && (
            <div className="absolute bottom-4 left-4 right-4 z-40 flex justify-center">
            <button 
                onClick={handleCopyText}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-bold text-xs shadow-lg hover:scale-105 transition-transform"
            >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied to Clipboard" : "Copy Summary Text"}
            </button>
            </div>
        )}
      </div>
    </div>
  );
};
