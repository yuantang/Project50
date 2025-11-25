
import React from 'react';
import { UserProgress } from '../types';
import { Snowflake, Check } from 'lucide-react';

interface HeatmapProps {
  progress: UserProgress;
}

export const Heatmap: React.FC<HeatmapProps> = ({ progress }) => {
  const totalDays = progress.totalDays || 50;
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Helper to get completion status for a specific day number
  const getCompletionLevel = (dayNum: number) => {
    // Future
    if (dayNum > progress.currentDay) return -1;
    
    const data = progress.history[dayNum];
    if (!data) return 0; // Incomplete (but current or past)
    
    if (data.frozen) return 'frozen';
    
    const count = data.completedHabits.length;
    const total = progress.customHabits.length;
    
    if (count === 0) return 0;
    if (count < total) return 2; // Partial
    return 3; // Perfect
  };

  const getDayStyle = (level: number | string, isToday: boolean) => {
    let base = "bg-zinc-900/40 border-zinc-800/60 text-zinc-700";
    
    if (level === -1) base = "bg-transparent border-zinc-800/30 text-zinc-800"; // Future
    else if (level === 0) base = "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-700"; // Incomplete
    else if (level === 2) base = "bg-emerald-900/10 border-emerald-500/20 text-emerald-600/70"; // Partial
    else if (level === 3) base = "bg-emerald-500 border-emerald-400 text-black font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]"; // Perfect
    else if (level === 'frozen') base = "bg-cyan-900/10 border-cyan-500/20 text-cyan-500"; // Frozen

    if (isToday) {
      if (level === 3) return base + " ring-1 ring-white/30 z-10 scale-105"; 
      return "bg-zinc-800 border-zinc-600 text-white ring-1 ring-emerald-500/40 shadow-lg z-10 scale-110"; // Today highlight
    }

    return base;
  };

  const getCompletionPercentage = () => {
    let completed = 0;
    for(let i=1; i<=progress.currentDay; i++) {
        if(progress.history[i]?.completedHabits.length === progress.customHabits.length || progress.history[i]?.frozen) {
            completed++;
        }
    }
    return Math.round((completed / Math.max(1, progress.currentDay)) * 100);
  }

  return (
    <div className="bg-surface border border-zinc-800 rounded-xl p-4 mb-6 shadow-lg shadow-black/20">
      <div className="flex flex-row items-center justify-between mb-4 px-1">
        <div>
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              Challenge Grid
              <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-400 font-mono">
                  {progress.totalDays}D
              </span>
            </h3>
        </div>
        
        <div className="flex items-baseline gap-1.5">
           <span className="text-xl font-mono font-bold text-white tracking-tighter leading-none">{getCompletionPercentage()}%</span>
           <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Consistency</span>
        </div>
      </div>
      
      {/* 
         Centered, Fixed-Width Grid 
         Compact sizing for exquisite look
      */}
      <div className="flex justify-center">
        <div className="grid grid-cols-10 gap-1.5 w-fit">
           {days.map((dayNum) => {
             const level = getCompletionLevel(dayNum);
             const isToday = dayNum === progress.currentDay;
             const isFuture = level === -1;
             
             return (
               <div 
                  key={dayNum}
                  title={`Day ${dayNum}`}
                  className={`
                      w-7 h-7 md:w-9 md:h-9 rounded-[3px] border flex items-center justify-center transition-all duration-300 relative group font-mono text-[10px] cursor-default
                      ${getDayStyle(level, isToday)}
                  `}
               >
                  {level === 'frozen' ? (
                    <Snowflake size={10} strokeWidth={2.5} />
                  ) : (
                    <span>{dayNum}</span>
                  )}

                  {/* Status Indicator Icon (Mini) */}
                  {level === 3 && !isToday && (
                     <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-400 rounded-full p-[0.5px] border-[1px] border-zinc-950 z-10">
                        <Check size={3} className="text-black stroke-[4]" />
                     </div>
                  )}
               </div>
             );
           })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 mt-4 pt-3 border-t border-zinc-800/50">
           <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-zinc-800 border border-zinc-600 rounded-[1px]"></div>
               <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Current</span>
           </div>
           <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-emerald-500 border border-emerald-400 rounded-[1px] shadow-[0_0_4px_rgba(16,185,129,0.3)]"></div>
               <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Complete</span>
           </div>
           <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-emerald-900/20 border border-emerald-500/20 rounded-[1px]"></div>
               <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Partial</span>
           </div>
           <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-cyan-900/20 border border-cyan-500/20 rounded-[1px]"></div>
               <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Frozen</span>
           </div>
      </div>
    </div>
  );
};
