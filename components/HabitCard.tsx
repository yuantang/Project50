
import React, { useState, memo } from 'react';
import { 
  // Specific imports for tree shaking
  Activity, AlarmClock, Apple, Bike, Book, BookOpen, 
  Brain, Camera, CircleCheck, Coffee, Code, Dumbbell, 
  Droplet, Flame, Flower2, Gamepad2, Heart, Moon, 
  Music, Palette, PenTool, Footprints, Sun, Target, Zap,
  Briefcase, DollarSign, Utensils, GlassWater, BedDouble,
  Circle, CircleHelp, Check, Sparkles, Lightbulb, Timer
} from 'lucide-react';
import { Habit } from '../types';

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  log?: string;
  onToggle: (id: string) => void;
  onLogChange?: (text: string) => void;
  onOpenTimer?: (habit: Habit) => void;
  onOpenGuide?: (habit: Habit) => void;
  disabled?: boolean;
  streak?: number;
  shortcutKey?: number;
}

// Map of allowed icons
const ICON_MAP: Record<string, React.ElementType> = {
  Activity, AlarmClock, Apple, Bike, Book, BookOpen, 
  Brain, Camera, CircleCheck, Coffee, Code, Dumbbell, 
  Droplet, Flame, Flower2, Gamepad2, Heart, Moon, 
  Music, Palette, PenTool, Footprints, Sun, Target, Zap,
  Briefcase, DollarSign, Utensils, GlassWater, BedDouble,
  Circle, CircleHelp
};

export const HabitCard = memo<HabitCardProps>(({ 
  habit, 
  completed, 
  log,
  onToggle, 
  onLogChange,
  onOpenTimer,
  onOpenGuide,
  disabled,
  streak = 0,
  shortcutKey
}) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const [showLogInput, setShowLogInput] = useState(false);

  const iconName = habit.icon || 'Circle';
  const IconComponent = ICON_MAP[iconName] || ICON_MAP['CircleHelp'];

  const handleToggle = () => {
    if (disabled) return;
    
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 350);
    
    if (!completed) {
      setShowLogInput(true);
    }
    onToggle(habit.id);
  };

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border transition-all duration-300 ease-out transform group select-none
        ${completed 
          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]' 
          : 'bg-surface border-zinc-800 hover:border-zinc-700'}
        ${disabled ? 'opacity-60 grayscale' : 'active:scale-[0.98]'}
      `}
    >
      {/* Shimmer Effect on Complete */}
      {completed && !disabled && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent skew-x-12 z-0 pointer-events-none" />
      )}

      <div 
        className={`
          pointer-events-none absolute inset-0 z-20 bg-emerald-400/30 mix-blend-overlay
          transition-opacity duration-300 ease-out
          ${isFlashing ? 'opacity-100' : 'opacity-0'}
        `} 
      />

      <div className="flex flex-col relative z-10">
        <div className="flex items-center">
          {/* Main Click Area */}
          <div 
            onClick={handleToggle}
            className={`
              flex-1 flex items-center gap-3 p-3 sm:p-4 transition-all relative
              ${disabled ? 'cursor-default' : 'cursor-pointer'}
              ${!disabled && completed ? 'hover:bg-emerald-500/5' : ''}
              ${!disabled && !completed ? 'hover:bg-zinc-900' : ''}
            `}
          >
            <div className={`
              p-2.5 rounded-full transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) relative shrink-0
              ${completed 
                ? 'bg-emerald-500 text-black scale-110 rotate-3 shadow-lg shadow-emerald-500/20' 
                : 'bg-zinc-800 text-zinc-400 scale-100'}
              ${!disabled && !completed ? 'group-hover:bg-zinc-700 group-hover:scale-105' : ''}
            `}>
              <IconComponent size={22} strokeWidth={completed ? 2.5 : 2} className="transition-all duration-300" />
            </div>
            
            <div className="flex-1 relative min-w-0">
              <h3 className={`font-semibold text-sm sm:text-base transition-colors duration-300 truncate pr-1 ${completed ? 'text-emerald-400' : 'text-zinc-100'}`}>
                {habit.label}
              </h3>
              
              <div className="flex items-center gap-2 mt-0.5">
                {streak > 1 && (
                  <div 
                    className="flex items-center gap-0.5 text-orange-500 shrink-0 animate-in fade-in" 
                    title={`${streak} day streak`}
                  >
                    <Flame size={10} fill="currentColor" className={streak > 7 ? 'animate-pulse' : ''} />
                    <span className="text-[10px] font-bold tabular-nums">{streak}</span>
                    <span className="text-[10px] text-zinc-600 mx-1 hidden sm:inline">•</span>
                  </div>
                )}
                <p className="text-xs text-zinc-500 line-clamp-1 flex-1 hidden sm:block">{habit.description}</p>
              </div>
            </div>

            {shortcutKey && !disabled && (
              <div className="hidden md:flex absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 items-center justify-center rounded border border-zinc-700 text-[9px] text-zinc-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                {shortcutKey}
              </div>
            )}

            <div className={`
              w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative overflow-visible shrink-0
              ${completed 
                ? 'bg-emerald-500 border-emerald-500 scale-100' 
                : 'border-zinc-700 scale-90 opacity-50 group-hover:opacity-100 group-hover:scale-100 group-hover:border-zinc-500'}
            `}>
              <div className={`absolute inset-0 bg-white/40 rounded-full transition-transform duration-300 ${isFlashing ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`} />
              
              {/* Spark Effect on Complete */}
              {completed && (
                 <Sparkles size={20} className="absolute text-yellow-300 animate-ping opacity-50 pointer-events-none" />
              )}

              <div className={`transition-all duration-300 transform relative z-10 ${completed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                <Check size={12} className="text-black" strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center self-stretch">
            {!disabled && onOpenGuide && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenGuide(habit);
                }}
                className="p-3 text-zinc-600 hover:text-yellow-400 hover:bg-zinc-800 transition-colors relative z-10 border-l border-zinc-800/50 active:bg-zinc-800"
                title="Get AI Advice"
              >
                <Lightbulb size={18} />
              </button>
            )}

            {!disabled && onOpenTimer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTimer(habit);
                }}
                className="p-3 text-zinc-600 hover:text-emerald-400 hover:bg-zinc-800 transition-colors relative z-10 border-l border-zinc-800/50 active:bg-zinc-800"
                title="Start Focus Timer"
              >
                <Timer size={18} />
              </button>
            )}
          </div>
        </div>

        {(showLogInput || (completed && log)) && onLogChange && (
          <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2">
            <input
              type="text"
              value={log || ''}
              onChange={(e) => onLogChange(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={`Add note for ${habit.label}...`}
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  );
});
