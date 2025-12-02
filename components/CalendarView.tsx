import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Activity, CircleCheck, RotateCcw } from 'lucide-react';
import { UserProgress, Mood } from '../types';

interface CalendarViewProps {
  progress: UserProgress;
  onDayClick: (day: number) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ progress, onDayClick }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'progress' | 'mood'>('progress');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const paddingDays = Array.from({ length: firstDayOfWeek });
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const changeMonth = (delta: number) => setViewDate(new Date(year, month + delta, 1));

  const getDayStatus = (dateStr: string) => {
    if (!progress.startDate) return 'future';
    const start = new Date(progress.startDate); start.setHours(0,0,0,0);
    const current = new Date(dateStr); current.setHours(0,0,0,0);
    const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const projectDayNum = diffDays + 1;

    if (projectDayNum < 1) return 'pre-challenge';
    if (projectDayNum > progress.totalDays) return 'post-challenge';

    const dayData = progress.history[projectDayNum];
    const isFuture = projectDayNum > progress.currentDay;
    const isToday = projectDayNum === progress.currentDay;
    const completedCount = dayData ? dayData.completedHabits.length : 0;
    const totalHabits = progress.customHabits.length;
    const isFull = completedCount === totalHabits;
    const isPartial = completedCount > 0 && completedCount < totalHabits;
    const hasData = !!dayData;

    return {
      status: isFuture ? 'future' : isFull ? 'full' : isPartial ? 'partial' : 'empty',
      dayNum: projectDayNum, isToday, hasNote: !!dayData?.notes, hasPhoto: !!dayData?.photo,
      frozen: dayData?.frozen, freezeReason: dayData?.freezeReason, mood: dayData?.mood, hasData
    };
  };

  const getMoodColor = (mood?: Mood) => {
    switch (mood) {
      case 'great': return 'bg-emerald-500 border-emerald-400 text-black';
      case 'good': return 'bg-blue-500 border-blue-400 text-white';
      case 'neutral': return 'bg-yellow-500 border-yellow-400 text-black';
      case 'bad': return 'bg-orange-500 border-orange-400 text-white';
      case 'terrible': return 'bg-red-500 border-red-400 text-white';
      default: return 'bg-zinc-800 border-zinc-700 text-zinc-500';
    }
  };

  return (
    <div className="bg-surface border border-zinc-800 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-lg relative">
      {/* Texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-noise mix-blend-overlay pointer-events-none" />

      <div className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between relative z-10">
        <div><h2 className="text-lg font-bold text-white tracking-tight">{monthNames[month]} <span className="text-zinc-600 font-medium">{year}</span></h2></div>
        <div className="flex items-center gap-3">
            <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button onClick={() => setViewMode('progress')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'progress' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}><CircleCheck size={12} />Progress</button>
                <button onClick={() => setViewMode('mood')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'mood' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}><Activity size={12} />Mood</button>
            </div>
            <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
              <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
              <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>
            </div>
        </div>
      </div>

      <div className="px-4 pb-6 relative z-10">
        <div className="grid grid-cols-7 mb-2">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest py-2">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
          {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = new Date(year, month, day).toISOString();
            const info = getDayStatus(dateStr);
            
            if (typeof info === 'string') return <div key={day} className="aspect-square flex items-center justify-center"><span className="text-zinc-800 text-xs font-medium">{day}</span></div>;

            const { status, dayNum, isToday, hasNote, hasPhoto, frozen, freezeReason, mood, hasData } = info;
            let circleClass = "";
            let icon = null;
            // Only allow clicking if it's today, or if it's a past day with data
            const isClickable = isToday || (status !== 'future' && hasData);

            if (viewMode === 'progress') {
                circleClass = `${status === 'full' ? 'bg-emerald-600 shadow-lg shadow-emerald-900/20' : ''} ${status === 'partial' ? 'bg-zinc-800 border border-zinc-700' : ''} ${status === 'empty' && !isToday ? 'bg-transparent hover:bg-zinc-900' : ''} ${status === 'future' ? 'opacity-0' : ''}`;
                if (frozen) {
                  if (freezeReason?.includes('Time Warp')) {
                    circleClass = "bg-amber-900/30 border border-amber-500/40 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
                    icon = <RotateCcw size={10} className="absolute inset-0 m-auto opacity-50" />;
                  } else {
                    circleClass = "bg-cyan-900/20 border border-cyan-500/30 text-cyan-400";
                  }
                }
            } else {
                if (status === 'future' || status === 'empty') circleClass = 'bg-transparent hover:bg-zinc-900';
                else circleClass = `${getMoodColor(mood)} border`;
            }

            return (
              <button 
                key={day} 
                onClick={() => onDayClick(dayNum)} 
                disabled={!isClickable && status === 'future'}
                className={`relative group aspect-square flex flex-col items-center justify-center rounded-lg transition-all ${isClickable ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
              >
                <div className={`absolute inset-0 m-auto w-8 h-8 rounded-full transition-all duration-300 ${circleClass} ${isToday ? 'ring-1 ring-white ring-offset-2 ring-offset-surface' : ''}`}>{icon}</div>
                <span className={`relative z-10 text-xs font-medium transition-colors ${viewMode === 'mood' && mood ? 'text-black/80 font-bold' : ''} ${status === 'full' && viewMode === 'progress' ? 'text-white' : ''} ${status === 'partial' && viewMode === 'progress' ? 'text-zinc-300' : ''} ${status === 'empty' ? 'text-zinc-500 group-hover:text-zinc-300' : ''} ${frozen && !freezeReason?.includes('Time Warp') ? 'text-cyan-400' : ''} ${frozen && freezeReason?.includes('Time Warp') ? 'text-amber-300' : ''}`}>{!icon && day}</span>
                {frozen && freezeReason?.includes('Time Warp') && <span className="absolute inset-0 flex items-center justify-center text-amber-200 text-xs font-bold z-20">{day}</span>}
                <div className="absolute bottom-1 flex gap-0.5 z-10">{hasNote && <div className={`w-0.5 h-0.5 rounded-full ${status === 'full' || mood ? 'bg-white/70' : 'bg-zinc-500'}`} />}{hasPhoto && <div className={`w-0.5 h-0.5 rounded-full ${status === 'full' || mood ? 'bg-purple-300' : 'bg-purple-500'}`} />}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="bg-zinc-900/30 px-6 py-3 border-t border-zinc-800/50 flex flex-wrap justify-between items-center text-[9px] text-zinc-500 font-medium gap-2 relative z-10">
         {viewMode === 'progress' ? (
             <div className="flex gap-3">
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div> Done</span>
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-cyan-900/30 border border-cyan-500/30 rounded-full"></div> Frozen</span>
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-amber-900/30 border border-amber-500/40 rounded-full"></div> Redeemed</span>
             </div>
         ) : (
             <div className="flex gap-2 overflow-x-auto">
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Great</span>
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div> Neutral</span>
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Bad</span>
             </div>
         )}
      </div>
    </div>
  );
};