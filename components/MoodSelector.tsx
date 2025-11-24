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
    <div className="flex justify-between items-center bg-black/20 p-2 rounded-xl">
      {moods.map((m) => {
        const isSelected = selected === m.value;
        const Icon = m.icon;
        
        return (
          <button
            key={m.value}
            onClick={() => !disabled && onSelect(m.value)}
            disabled={disabled}
            className={`
              flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200
              ${isSelected ? 'bg-zinc-800 scale-110 shadow-lg' : 'hover:bg-zinc-800/50 opacity-60 hover:opacity-100'}
              ${disabled ? 'cursor-default opacity-40 hover:opacity-40 hover:bg-transparent' : ''}
            `}
          >
            <Icon 
              size={24} 
              className={`transition-colors ${isSelected ? m.color : 'text-zinc-400'}`} 
              fill={isSelected ? 'currentColor' : 'none'}
              fillOpacity={0.2}
            />
            <span className={`text-[10px] font-medium ${isSelected ? 'text-zinc-200' : 'text-zinc-600'}`}>
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};