
import React, { useRef, useState } from 'react';
import { UserProgress } from '../types';
import { Trophy, Quote, Download, Loader2, Check, Flame, Star } from 'lucide-react';
import { Heatmap } from './Heatmap';

// Declare html2canvas on window
declare global {
  interface Window {
    html2canvas: any;
  }
}

interface LongShareProps {
  progress: UserProgress;
}

export const LongShare: React.FC<LongShareProps> = ({ progress }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const handleDownload = async () => {
    if (!ref.current || !window.html2canvas) return;
    setGenerating(true);
    
    try {
        const canvas = await window.html2canvas(ref.current, {
            backgroundColor: '#09090b',
            scale: 2, // Retina quality
            useCORS: true, // For images
            logging: false
        });
        
        const link = document.createElement('a');
        link.download = `Project${progress.totalDays}_Report_Day${progress.currentDay}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        setDone(true);
        setTimeout(() => setDone(false), 3000);
    } catch (e) {
        console.error("Screenshot failed", e);
        alert("Could not generate image. Please screenshot manually.");
    } finally {
        setGenerating(false);
    }
  };

  const completionRate = Math.round(
    (Object.values(progress.history).reduce((acc, day) => acc + day.completedHabits.length, 0) / 
    (Math.max(1, progress.currentDay) * progress.customHabits.length)) * 100
  ) || 0;

  // Calculate Streak
  let currentStreak = 0;
  for (let i = progress.currentDay; i >= 1; i--) {
    const d = progress.history[i];
    // Check if completed or frozen (and not future/empty)
    if (d && (d.completedHabits.length === progress.customHabits.length || d.frozen)) {
        currentStreak++;
    } else if (i === progress.currentDay) {
        // If today is not done yet, check yesterday
        continue;
    } else {
        break;
    }
  }
  // Correction if today is empty but yesterday was done
  if (currentStreak === 0 && progress.currentDay > 1) {
      const yesterday = progress.history[progress.currentDay - 1];
      if (yesterday && (yesterday.completedHabits.length === progress.customHabits.length || yesterday.frozen)) {
          // Basic recalculate from yesterday
          for (let i = progress.currentDay - 1; i >= 1; i--) {
             const d = progress.history[i];
             if (d && (d.completedHabits.length === progress.customHabits.length || d.frozen)) {
                 currentStreak++;
             } else break;
          }
      }
  }

  // Calc Best Streak
  let bestStreak = 0;
  let tempStreak = 0;
  for (let i = 1; i <= progress.currentDay; i++) {
      const d = progress.history[i];
      if (d && (d.completedHabits.length === progress.customHabits.length || d.frozen)) {
          tempStreak++;
      } else {
          tempStreak = 0;
      }
      if (tempStreak > bestStreak) bestStreak = tempStreak;
  }

  return (
    <div className="flex flex-col items-center h-full bg-zinc-900">
       <div className="flex-1 overflow-y-auto custom-scrollbar w-full flex justify-center p-4">
          {/* The Capture Target */}
          <div 
            ref={ref}
            className="w-full max-w-sm bg-zinc-950 border border-zinc-800 p-8 text-center space-y-8 relative overflow-hidden shadow-2xl"
            style={{ minHeight: '800px' }} // Force long height
          >
             {/* Header */}
             <div className="flex flex-col items-center gap-3 pt-4">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 transform rotate-3">
                   <Trophy className="text-black w-8 h-8" strokeWidth={3} />
                </div>
                <div>
                   <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Project {progress.totalDays}</h1>
                   <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest mt-1">Official Report</p>
                </div>
             </div>

             {/* User Info */}
             <div className="border-t border-b border-zinc-900 py-6">
                <h2 className="text-xl font-bold text-white">{progress.userName || "Challenger"}</h2>
                <p className="text-emerald-500 font-mono text-sm font-medium">Day {progress.currentDay} / {progress.totalDays}</p>
             </div>

             {/* Manifesto */}
             {progress.manifesto && (
               <div className="relative px-4 py-2">
                  <Quote className="absolute top-0 left-0 text-zinc-800 w-8 h-8" />
                  <p className="text-zinc-300 font-serif italic text-lg leading-relaxed relative z-10">
                    "{progress.manifesto}"
                  </p>
               </div>
             )}

             {/* Stats Grid */}
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex flex-col items-center">
                   <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Level</p>
                   <p className="text-2xl font-black text-white">{progress.level}</p>
                </div>
                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex flex-col items-center">
                   <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Consistency</p>
                   <p className="text-2xl font-black text-emerald-400">{completionRate}%</p>
                </div>
                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex flex-col items-center">
                   <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                     Current <Flame size={10} className="text-orange-500" />
                   </p>
                   <p className="text-2xl font-black text-orange-500">{currentStreak}</p>
                </div>
                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex flex-col items-center">
                   <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                     Best <Star size={10} className="text-yellow-500" />
                   </p>
                   <p className="text-2xl font-black text-yellow-500">{bestStreak}</p>
                </div>
             </div>

             {/* The Heatmap */}
             <div className="py-4">
                <Heatmap progress={progress} />
             </div>

             {/* Footer */}
             <div className="pt-8 pb-4 border-t border-zinc-900">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">Discipline is Destiny</p>
                <p className="text-[8px] text-zinc-700 mt-2 font-mono">{new Date().toLocaleDateString()} • Project 50 Tracker</p>
             </div>
          </div>
       </div>

       {/* Actions */}
       <div className="p-4 w-full bg-zinc-900 border-t border-zinc-800 flex justify-center shrink-0">
          <button 
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10 disabled:opacity-50"
          >
            {generating ? <Loader2 className="animate-spin" size={16} /> : done ? <Check size={16} /> : <Download size={16} />}
            {generating ? "Generating..." : done ? "Saved to Device" : "Save Image"}
          </button>
       </div>
    </div>
  );
};
