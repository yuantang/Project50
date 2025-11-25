
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, Circle, Quote, Image as ImageIcon } from 'lucide-react';
import { UserProgress } from '../types';

interface CalendarViewProps {
  progress: UserProgress;
  onDayClick: (day: number) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ progress, onDayClick }) => {
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

    const start = new Date(progress.startDate);
    start.setHours(0,0,0,0);
    
    const current = new Date(dateStr);
    current.setHours(0,0,0,0);

    const diffTime = current.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
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

    const hasNote = dayData?.notes && dayData.notes.length > 0;
    const hasPhoto = !!dayData?.photo;

    return {
      status: isFuture ? 'future' : isFull ? 'full' : isPartial ? 'partial' : 'empty',
      dayNum: projectDayNum,
      isToday,
      hasNote,
      hasPhoto,
      frozen: dayData?.frozen
    };
  };

  return (
    <div className="bg-surface border border-zinc-800 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-lg">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {monthNames[month]} <span className="text-zinc-600 font-medium">{year}</span>
          </h2>
        </div>
        <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
          <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-7 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = new Date(year, month, day).toISOString();
            const info = getDayStatus(dateStr);
            
            // Render non-project days as dimmed text
            if (typeof info === 'string') {
               return (
                <div key={day} className="aspect-square flex items-center justify-center">
                  <span className="text-zinc-800 text-xs font-medium">{day}</span>
                </div>
               );
            }

            const { status, dayNum, isToday, hasNote, hasPhoto, frozen } = info;

            return (
              <button
                key={day}
                onClick={() => onDayClick(dayNum)}
                className="relative group aspect-square flex flex-col items-center justify-center"
              >
                {/* Background Circle for Status */}
                <div className={`
                  absolute inset-0 m-auto w-8 h-8 rounded-full transition-all duration-300
                  ${isToday ? 'ring-1 ring-emerald-500 ring-offset-2 ring-offset-surface' : ''}
                  ${status === 'full' ? 'bg-emerald-600 shadow-lg shadow-emerald-900/20' : ''}
                  ${status === 'partial' ? 'bg-zinc-800 border border-zinc-700' : ''}
                  ${status === 'empty' && !isToday ? 'bg-transparent hover:bg-zinc-900' : ''}
                  ${status === 'future' ? 'opacity-0' : ''}
                  ${frozen ? 'bg-cyan-900/30 border border-cyan-500/30' : ''}
                `} />

                {/* Day Number */}
                <span className={`
                  relative z-10 text-xs font-medium transition-colors
                  ${status === 'full' ? 'text-white' : ''}
                  ${status === 'partial' ? 'text-zinc-300' : ''}
                  ${status === 'empty' ? 'text-zinc-500 group-hover:text-zinc-300' : ''}
                  ${status === 'future' ? 'text-zinc-800' : ''}
                  ${frozen ? 'text-cyan-400' : ''}
                `}>
                  {day}
                </span>

                {/* Tiny Dot Indicators (Note/Photo) */}
                <div className="absolute bottom-1 flex gap-0.5 z-10">
                   {hasNote && <div className={`w-0.5 h-0.5 rounded-full ${status === 'full' ? 'bg-white/70' : 'bg-zinc-500'}`} />}
                   {hasPhoto && <div className={`w-0.5 h-0.5 rounded-full ${status === 'full' ? 'bg-purple-300' : 'bg-purple-500'}`} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Footer Legend */}
      <div className="bg-zinc-900/30 px-6 py-3 border-t border-zinc-800/50 flex justify-between items-center text-[9px] text-zinc-500 font-medium">
         <div className="flex gap-3">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div> Done</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-zinc-800 border border-zinc-700 rounded-full"></div> Partial</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-transparent border border-emerald-500 rounded-full"></div> Today</span>
         </div>
      </div>
    </div>
  );
};
