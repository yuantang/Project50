
import React from 'react';
import { UserProgress } from '../types';

interface HeatmapProps {
  progress: UserProgress;
}

export const Heatmap: React.FC<HeatmapProps> = ({ progress }) => {
  // Show the last ~5 months (21 weeks) to ensure the grid is always populated and relevant,
  // rather than a full year which is empty in Jan and huge in Dec.
  
  const today = new Date();
  // Normalize today to midnight to avoid mismatch
  today.setHours(0,0,0,0);

  const totalDaysToShow = 21 * 7; // 21 Weeks (~147 Days)
  
  // Generate dates for the trailing window
  const days: (Date | null)[] = [];
  
  // Start date is today minus X days
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - totalDaysToShow + 1);

  // Align startDate to the previous Sunday to keep the grid nice
  const dayOfWeek = startDate.getDay(); // 0 = Sun
  startDate.setDate(startDate.getDate() - dayOfWeek);

  // Generate the array of dates
  const iterDate = new Date(startDate);
  while (iterDate <= today) {
    days.push(new Date(iterDate));
    iterDate.setDate(iterDate.getDate() + 1);
  }

  // Helper to get completion status for a specific date
  const getCompletionLevel = (date: Date) => {
    if (!progress.startDate) return 0;
    
    // Calculate Project Day Number
    const start = new Date(progress.startDate);
    start.setHours(0,0,0,0);
    
    const check = new Date(date);
    check.setHours(0,0,0,0);
    
    // If check date is before start date, it's level 0
    if (check < start) return 0;

    const diffTime = check.getTime() - start.getTime();
    const dayNum = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (dayNum > progress.totalDays) return 0;

    const data = progress.history[dayNum];
    if (!data) return 0;
    
    const count = data.completedHabits.length;
    const total = progress.customHabits.length;
    
    if (data.frozen) return 2; // Frozen days show as partial/saved
    if (count === 0) return 0;
    if (count < total / 2) return 1; // Low
    if (count < total) return 2; // Medium
    return 3; // Perfect
  };

  const getDayColor = (level: number) => {
    switch(level) {
      case 0: return 'bg-zinc-900 border-zinc-800';
      case 1: return 'bg-emerald-900/40 border-emerald-900/60';
      case 2: return 'bg-emerald-600/60 border-emerald-500/50';
      case 3: return 'bg-emerald-500 border-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.4)]';
      default: return 'bg-zinc-900';
    }
  };

  // Group by weeks (columns)
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  // Push partial week if any (though our alignment logic usually prevents this)
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <div className="bg-surface border border-zinc-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
          Consistency (Last 5 Months)
        </h3>
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-500">
           <span>Less</span>
           <div className="w-3 h-3 bg-zinc-900 rounded-sm border border-zinc-800" />
           <div className="w-3 h-3 bg-emerald-900/40 rounded-sm border border-emerald-900/60" />
           <div className="w-3 h-3 bg-emerald-600/60 rounded-sm border border-emerald-500/50" />
           <div className="w-3 h-3 bg-emerald-500 rounded-sm border border-emerald-400" />
           <span>More</span>
        </div>
      </div>
      
      {/* Scrollable container for mobile, but constrained for desktop */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-1">
                {week.map((day, dIndex) => {
                  if (!day) return <div key={dIndex} className="w-3 h-3" />;
                  const level = getCompletionLevel(day);
                  return (
                    <div 
                      key={dIndex}
                      className={`w-3 h-3 rounded-sm border ${getDayColor(level)} transition-colors`}
                      title={`${day.toLocaleDateString()}: Level ${level}`}
                    />
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
