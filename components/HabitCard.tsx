
import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Habit } from '../types';
import { Timer, Flame, Lightbulb } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  onToggle: (id: string) => void;
  onOpenTimer?: (habit: Habit) => void;
  onOpenGuide?: (habit: Habit) => void;
  disabled?: boolean;
  streak?: number;
  shortcutKey?: number; // New prop for visual hint
}

export const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  completed, 
  onToggle, 
  onOpenTimer,
  onOpenGuide,
  disabled,
  streak = 0,
  shortcutKey
}) => {
  const [isFlashing, setIsFlashing] = useState(false);

  // Dynamically get the icon component with robust fallback
  const iconName = habit.icon || 'Circle';
  const IconComponent = (Icons as any)[iconName] || Icons.Circle || Icons.HelpCircle;

  if (!IconComponent) return null;

  const handleToggle = () => {
    if (disabled) return;
    
    // Trigger visual flash only when marking as complete
    if (!completed) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 350);
    }
    onToggle(habit.id);
  };

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border transition-all duration-500 ease-out transform group
        ${completed 
          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]' 
          : 'bg-surface border-zinc-800 hover:border-zinc-700'}
        ${disabled ? 'opacity-60' : ''}
      `}
    >
      {/* Flash Overlay Effect */}
      <div 
        className={`
          pointer-events-none absolute inset-0 z-20 bg-emerald-400/30 mix-blend-overlay
          transition-opacity duration-300 ease-out
          ${isFlashing ? 'opacity-100' : 'opacity-0'}
        `} 
      />

      <div className="flex items-center">
        {/* Main Click Area */}
        <div 
          onClick={handleToggle}
          className={`
            flex-1 flex items-center gap-4 p-4 transition-all relative z-10 active:scale-[0.98]
            ${disabled ? 'cursor-default' : 'cursor-pointer'}
            ${!disabled && completed ? 'hover:bg-emerald-500/20' : ''}
            ${!disabled && !completed ? 'hover:bg-zinc-900' : ''}
          `}
        >
          <div className={`
            p-3 rounded-full transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) relative
            ${completed 
              ? 'bg-emerald-500 text-black scale-110 rotate-3 shadow-lg shadow-emerald-500/20' 
              : 'bg-zinc-800 text-zinc-400 scale-100'}
            ${!disabled && !completed ? 'group-hover:bg-zinc-700 group-hover:scale-105' : ''}
          `}>
            <IconComponent size={24} strokeWidth={completed ? 2.5 : 2} className="transition-all duration-300" />
          </div>
          
          <div className="flex-1 relative">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold text-lg transition-colors duration-300 ${completed ? 'text-emerald-400' : 'text-zinc-100'}`}>
                {habit.label}
              </h3>
              
              {/* Individual Streak Indicator */}
              {streak > 1 && (
                <div 
                  className={`
                    flex items-center gap-1 text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded text-[10px] font-bold border border-orange-500/20
                    ${streak > 7 ? 'animate-pulse' : ''}
                  `} 
                  title={`${streak} day streak`}
                >
                  <Flame size={10} fill="currentColor" />
                  <span>{streak}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-zinc-500 line-clamp-1">{habit.description}</p>
          </div>

          {/* Keyboard Shortcut Badge (Desktop Only) */}
          {shortcutKey && !disabled && (
            <div className="hidden md:flex absolute right-16 top-1/2 -translate-y-1/2 w-6 h-6 items-center justify-center rounded border border-zinc-700 text-[10px] text-zinc-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
              {shortcutKey}
            </div>
          )}

          <div className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 mr-2 relative overflow-hidden
            ${completed 
              ? 'bg-emerald-500 border-emerald-500 scale-100' 
              : 'border-zinc-700 scale-90 opacity-50 group-hover:opacity-100 group-hover:scale-100 group-hover:border-zinc-500'}
          `}>
            {/* Ripple origin point for the checkbox */}
            <div className={`absolute inset-0 bg-white/40 rounded-full transition-transform duration-300 ${isFlashing ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`} />
            
            <div className={`transition-all duration-300 transform relative z-10 ${completed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
              <Icons.Check size={14} className="text-black" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center border-l border-zinc-800/50">
          {!disabled && onOpenGuide && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenGuide(habit);
              }}
              className="p-4 text-zinc-600 hover:text-yellow-400 hover:bg-zinc-800 transition-colors relative z-10"
              title="Get AI Advice"
            >
              <Lightbulb size={20} />
            </button>
          )}

          {!disabled && onOpenTimer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenTimer(habit);
              }}
              className="p-4 text-zinc-600 hover:text-emerald-400 hover:bg-zinc-800 transition-colors relative z-10 border-l border-zinc-800/50"
              title="Start Focus Timer"
            >
              <Timer size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
