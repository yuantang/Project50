import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Timer } from 'lucide-react';
import { Habit } from '../types';

interface HabitTimerProps {
  habit: Habit;
  onClose: () => void;
}

export const HabitTimer: React.FC<HabitTimerProps> = ({ habit, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(0);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      // Play a sound or notify
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const setPreset = (minutes: number) => {
    const seconds = minutes * 60;
    setTimeLeft(seconds);
    setInitialTime(seconds);
    setIsActive(false);
  };

  const toggleTimer = () => {
    if (timeLeft === 0 && initialTime === 0) return;
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = initialTime > 0 ? ((initialTime - timeLeft) / initialTime) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
            <Timer size={24} />
          </div>
          <h3 className="text-lg font-medium text-white">{habit.label}</h3>
          <p className="text-sm text-zinc-500">Focus Mode</p>
        </div>

        {/* Timer Display */}
        <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
          {/* Progress Circle Background */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              className="text-zinc-800 stroke-current"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              className="text-emerald-500 stroke-current transition-all duration-1000"
              strokeWidth="8"
              fill="none"
              strokeDasharray={553} // 2 * pi * 88
              strokeDashoffset={553 - (553 * progress) / 100}
              strokeLinecap="round"
            />
          </svg>
          
          <div className="text-5xl font-mono font-bold text-white tabular-nums">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <button 
            onClick={resetTimer}
            className="p-3 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <RotateCcw size={20} />
          </button>
          
          <button 
            onClick={toggleTimer}
            className={`
              p-6 rounded-full transition-all transform hover:scale-105 active:scale-95
              ${isActive ? 'bg-zinc-800 text-white' : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'}
            `}
          >
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-3 gap-3">
          {[10, 30, 60].map(mins => (
            <button
              key={mins}
              onClick={() => setPreset(mins)}
              className="py-2 rounded-lg bg-zinc-800 text-zinc-400 text-sm font-medium hover:bg-zinc-700 hover:text-white transition-colors"
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};