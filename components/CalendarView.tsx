
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, CircleCheck, XCircle, AlertCircle, FileText, Camera } from 'lucide-react';
import { UserProgress } from '../types';

interface CalendarViewProps {
  progress: UserProgress;
  onDayClick: (day: number) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ progress, onDayClick }) => {
  // Determine the date to show. Default to current real-world month, or the month of Day 1 if set.
  const startDate = progress.startDate ? new Date(progress.startDate) : new Date();
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfMonth(year, month);
  const paddingDays = Array.from({ length: firstDayOfWeek });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const changeMonth = (delta: number) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  const getDayStatus = (dateStr: string) => {
    if (!progress.startDate) return 'future';

    // Find if this calendar date corresponds to a "Project Day"
    // This is an approximation. Ideally, we map specific dates to Day numbers.
    // For this simple implementation, we compare dates.
    
    // Parse start date (strip time)
    const start = new Date(progress.startDate);
    start.setHours(0,0,0,0);
    
    const current = new Date(dateStr);
    current.setHours(0,0,0,0);

    const diffTime = current.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const projectDayNum = diffDays + 1; // Day 1 is index 0 + 1

    if (projectDayNum < 1) return 'pre-challenge';
    if (projectDayNum > progress.totalDays) return 'post-challenge';

    const dayData = progress.history[projectDayNum];
    const isFuture = projectDayNum > progress.currentDay;
    const isToday = projectDayNum === progress.currentDay;
    
    const completedCount = dayData ? dayData.completedHabits.length : 0;
    const totalHabits = progress.customHabits.length;
    const isFull = completedCount === totalHabits;
    const isPartial = completedCount > 0 && completedCount < totalHabits;

    const hasNote = dayData?.notes && dayData.notes.length > 0;
    const hasPhoto = !!dayData?.photo;

    return {
      status: isFuture ? 'future' : isFull ? 'full' : isPartial ? 'partial' : 'empty',
      dayNum: projectDayNum,
      isToday,
      hasNote,
      hasPhoto
    };
  };

  return (
    <div className="bg-surface border border-zinc-800 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {monthNames[month]} <span className="text-zinc-500">{year}</span>
        </h2>
        <div className="flex gap-1">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = new Date(year, month, day).toISOString();
            const info = getDayStatus(dateStr);
            
            if (typeof info === 'string') {
               return (
                <div key={day} className="aspect-square rounded-lg border border-zinc-800/50 bg-black/20 flex items-center justify-center opacity-30">
                  <span className="text-zinc-600 text-sm">{day}</span>
                </div>
               );
            }

            const { status, dayNum, isToday, hasNote, hasPhoto } = info;

            return (
              <button
                key={day}
                onClick={() => onDayClick(dayNum)}
                className={`
                  relative aspect-square rounded-lg border transition-all duration-300 group
                  flex flex-col items-center justify-center gap-1
                  ${isToday ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-950' : ''}
                  ${status === 'future' ? 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed hover:bg-zinc-900' : ''}
                  ${status === 'full' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20' : ''}
                  ${status === 'partial' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20' : ''}
                  ${status === 'empty' && !isToday ? 'bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/10' : ''}
                  ${status === 'empty' && isToday ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : ''}
                `}
              >
                <span className={`text-sm font-bold ${isToday ? 'text-white' : ''}`}>{day}</span>
                
                {/* Indicator Icons */}
                <div className="flex gap-0.5 opacity-60">
                   {hasNote && <div className="w-1 h-1 rounded-full bg-zinc-400" />}
                   {hasPhoto && <div className="w-1 h-1 rounded-full bg-purple-500" />}
                </div>

                {/* Status Icon */}
                <div className="opacity-80 mt-0.5">
                  {status === 'full' && <CircleCheck size={12} />}
                  {status === 'partial' && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                  {status === 'empty' && !isToday && <XCircle size={12} />}
                  {status === 'future' && <Lock size={10} className="opacity-50" />}
                </div>

                <div className="absolute top-1 right-1 text-[8px] text-zinc-500 opacity-0 group-hover:opacity-100 font-mono">
                  D{dayNum}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="px-6 pb-6 pt-2 flex flex-wrap justify-center gap-4 text-[10px] text-zinc-500">
        <div className="flex items-center gap-1.5">
           <CircleCheck size={10} className="text-emerald-500" />
           <span>Complete</span>
        </div>
        <div className="flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
           <span>Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
           <div className="w-1 h-1 rounded-full bg-zinc-400" />
           <span>Note</span>
        </div>
        <div className="flex items-center gap-1.5">
           <div className="w-1 h-1 rounded-full bg-purple-500" />
           <span>Photo</span>
        </div>
      </div>
    </div>
  );
};
