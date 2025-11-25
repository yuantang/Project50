
import React, { useState, useEffect } from 'react';
import { Play, Pause, X, Maximize2, Minimize2, RotateCcw, Headphones, Waves, Wind, CloudRain } from 'lucide-react';
import { Habit } from '../types';
import { soundService, NoiseType } from '../services/soundService';
import { FocusMode } from './FocusMode';

interface FloatingTimerProps {
  habit: Habit | null;
  onClose: () => void;
  onTimerComplete?: (minutes: number, habitId: string) => void;
}

export const FloatingTimer: React.FC<FloatingTimerProps> = ({ habit, onClose, onTimerComplete }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false); 
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  const [noiseEnabled, setNoiseEnabled] = useState(false);
  const [noiseType, setNoiseType] = useState<NoiseType>('brown');
  const [showNoiseMenu, setShowNoiseMenu] = useState(false);

  // When habit changes, reset
  useEffect(() => {
    if (habit) {
      setTimeLeft(0);
      setInitialTime(0);
      setIsActive(false);
      setIsMinimized(false);
      setNoiseEnabled(false);
      setShowNoiseMenu(false);
      setIsFocusMode(false);
      soundService.toggleFocusNoise(false);
    }
  }, [habit?.id]);

  // Clean up noise on unmount or close
  useEffect(() => {
    return () => {
      soundService.toggleFocusNoise(false);
    };
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval: number | undefined;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      soundService.playTimerFinished();
      const minutes = Math.floor(initialTime / 60);
      if (minutes > 0 && onTimerComplete && habit) {
        onTimerComplete(minutes, habit.id);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleNoise = () => {
    const newState = !noiseEnabled;
    setNoiseEnabled(newState);
    soundService.setNoiseType(noiseType);
    soundService.toggleFocusNoise(newState);
  };

  const changeNoiseType = (type: NoiseType) => {
    setNoiseType(type);
    soundService.setNoiseType(type);
    if (!noiseEnabled) {
       setNoiseEnabled(true);
       soundService.toggleFocusNoise(true);
    }
    setShowNoiseMenu(false);
  };

  if (!habit) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const setPreset = (minutes: number) => {
    const s = minutes * 60;
    setInitialTime(s);
    setTimeLeft(s);
    setIsActive(true);
    soundService.playTimerStart();
  };

  const toggleTimer = () => {
    if (initialTime === 0 && timeLeft === 0) return;
    
    if (isActive) {
      setIsActive(false);
      soundService.playTimerPause();
    } else {
      setIsActive(true);
      soundService.playTimerStart();
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialTime);
    soundService.playClick();
  };

  const handleClose = () => {
    soundService.toggleFocusNoise(false);
    onClose();
  };

  // --- RENDER FOCUS MODE ---
  if (isFocusMode) {
    return (
        <FocusMode 
            habit={habit}
            timeLeft={timeLeft}
            initialTime={initialTime}
            isActive={isActive}
            onToggle={toggleTimer}
            onMinimize={() => setIsFocusMode(false)}
            onStop={handleClose}
            formatTime={formatTime}
        />
    );
  }

  // Render Minimized (Pill)
  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 animate-in slide-in-from-bottom-10 fade-in">
        <div className="bg-zinc-900 border border-zinc-800 rounded-full shadow-2xl shadow-black p-1 pr-4 flex items-center gap-3">
          <div 
            className={`
              w-10 h-10 rounded-full flex items-center justify-center cursor-pointer
              ${isActive ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}
            `}
            onClick={toggleTimer}
          >
            {isActive ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </div>
          
          <div 
            className="flex flex-col cursor-pointer"
            onClick={() => setIsMinimized(false)}
          >
            <span className="text-xs font-bold text-white font-mono leading-none">{formatTime(timeLeft)}</span>
            <span className="text-[10px] text-zinc-500 truncate max-w-[80px]">{habit.label}</span>
          </div>

          <button onClick={handleClose} className="text-zinc-600 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Render Expanded
  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 animate-in zoom-in-95 duration-300">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/80 w-72 overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-900/50 p-3 flex items-center justify-between border-b border-zinc-800 relative">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-xs font-medium text-zinc-300 truncate max-w-[120px]">{habit.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button 
                onClick={() => setShowNoiseMenu(!showNoiseMenu)}
                className={`p-1.5 rounded-md transition-colors ${noiseEnabled ? 'text-indigo-400 bg-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Soundscapes"
              >
                <Headphones size={14} />
              </button>
              
              {/* Noise Menu */}
              {showNoiseMenu && (
                <div className="absolute right-0 top-full mt-2 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-20 flex flex-col">
                   <button onClick={() => changeNoiseType('brown')} className={`px-3 py-2 text-xs text-left hover:bg-zinc-800 flex items-center gap-2 ${noiseType === 'brown' ? 'text-indigo-400' : 'text-zinc-400'}`}>
                      <Waves size={12} /> Brown (Deep)
                   </button>
                   <button onClick={() => changeNoiseType('pink')} className={`px-3 py-2 text-xs text-left hover:bg-zinc-800 flex items-center gap-2 ${noiseType === 'pink' ? 'text-pink-400' : 'text-zinc-400'}`}>
                      <CloudRain size={12} /> Pink (Soft)
                   </button>
                   <button onClick={() => changeNoiseType('white')} className={`px-3 py-2 text-xs text-left hover:bg-zinc-800 flex items-center gap-2 ${noiseType === 'white' ? 'text-white' : 'text-zinc-400'}`}>
                      <Wind size={12} /> White (Mask)
                   </button>
                   <div className="h-px bg-zinc-800 my-1" />
                   <button onClick={toggleNoise} className="px-3 py-2 text-xs text-left hover:bg-zinc-800 text-zinc-300">
                      {noiseEnabled ? 'Turn Off' : 'Turn On'}
                   </button>
                </div>
              )}
            </div>

            <button onClick={() => setIsFocusMode(true)} className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white" title="Full Screen Focus">
              <Maximize2 size={14} />
            </button>
            <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400">
              <Minimize2 size={14} />
            </button>
            <button onClick={handleClose} className="p-1.5 hover:bg-red-900/30 hover:text-red-400 rounded-md text-zinc-400">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center">
          <div className="text-5xl font-mono font-bold text-white mb-6 tabular-nums tracking-tight">
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-4 w-full justify-center mb-6">
             <button 
               onClick={resetTimer}
               className="p-3 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
             >
               <RotateCcw size={20} />
             </button>
             <button 
               onClick={toggleTimer}
               className={`
                 p-4 rounded-full transition-transform active:scale-95
                 ${isActive ? 'bg-zinc-800 text-white' : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'}
               `}
             >
               {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
             </button>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {[10, 30, 60].map(m => (
              <button
                key={m}
                onClick={() => setPreset(m)}
                className="py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
