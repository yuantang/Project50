import React from 'react';
import { Mood } from '../types';
import { Frown, Meh, Smile, ThumbsUp, Zap } from 'lucide-react';

interface MoodSelectorProps {
  selected?: Mood;
  onSelect: (mood: Mood) => void;
  disabled?: boolean;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ selected, onSelect, disabled }) => {
  const moods: { value: Mood; icon: React.ElementType; label: string; color: string }[] = [
    { value: 'terrible', icon: Frown, label: 'Terrible', color: 'text-red-500' },
    { value: 'bad', icon: Meh, label: 'Bad', color: 'text-orange-500' },
    { value: 'neutral', icon: Meh, label: 'Neutral', color: 'text-yellow-500' },
    { value: 'good', icon: Smile, label: 'Good', color: 'text-blue-500' },
    { value: 'great', icon: Zap, label: 'Great', color: 'text-emerald-500' },
  ];

  return (
    <div className="flex justify-between items-center bg-black/20 p-2 rounded-xl border border-white/5">
      {moods.map((m) => {
        const isSelected = selected === m.value;
        const Icon = m.icon;
        
        return (
          <button
            key={m.value}
            onClick={() => !disabled && onSelect(m.value)}
            disabled={disabled}
            className={`
              flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300 relative overflow-hidden group
              ${isSelected ? 'bg-zinc-800 shadow-lg ring-1 ring-white/10' : 'hover:bg-zinc-800/50 opacity-60 hover:opacity-100'}
              ${disabled ? 'cursor-default opacity-40 hover:opacity-40 hover:bg-transparent' : ''}
            `}
          >
            {isSelected && <div className={`absolute inset-0 opacity-10 bg-current ${m.color}`} />}
            
            <Icon 
              size={24} 
              className={`transition-all duration-300 ${isSelected ? `${m.color} scale-110` : 'text-zinc-400 group-hover:scale-105'}`} 
              fill={isSelected ? 'currentColor' : 'none'}
              fillOpacity={0.2}
              strokeWidth={isSelected ? 2.5 : 2}
            />
            <span className={`text-[10px] font-medium transition-colors ${isSelected ? 'text-zinc-200' : 'text-zinc-600'}`}>
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};