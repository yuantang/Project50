
import React, { useEffect } from 'react';
import { Pause, Play, Minimize2, X, Waves, Wind, CloudRain } from 'lucide-react';
import { Habit } from '../types';
import { soundService, NoiseType } from '../services/soundService';

interface FocusModeProps {
  habit: Habit;
  timeLeft: number;
  isActive: boolean;
  initialTime: number;
  onToggle: () => void;
  onMinimize: () => void;
  onStop: () => void;
  formatTime: (s: number) => string;
}

export const FocusMode: React.FC<FocusModeProps> = ({
  habit,
  timeLeft,
  isActive,
  initialTime,
  onToggle,
  onMinimize,
  onStop,
  formatTime
}) => {
  const [noiseType, setNoiseType] = React.useState<NoiseType>('brown');
  const [noiseEnabled, setNoiseEnabled] = React.useState(false);

  const progress = initialTime > 0 ? ((initialTime - timeLeft) / initialTime) * 100 : 0;

  const toggleNoise = (type: NoiseType) => {
    if (noiseEnabled && noiseType === type) {
        setNoiseEnabled(false);
        soundService.toggleFocusNoise(false);
    } else {
        setNoiseType(type);
        setNoiseEnabled(true);
        soundService.setNoiseType(type);
        soundService.toggleFocusNoise(true);
    }
  };

  // Cleanup noise on unmount handled by parent or service state
  useEffect(() => {}, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/20 to-black pointer-events-none" />
      
      {/* Top Controls */}
      <div className="absolute top-0 left-0 w-full p-6 md:p-8 flex justify-between items-start z-20">
        <div>
            <h2 className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-2">Current Task</h2>
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 ${isActive ? 'text-emerald-500' : 'text-zinc-500'}`}>
                 <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
               </div>
               <h1 className="text-xl md:text-2xl font-bold text-white max-w-[200px] md:max-w-md truncate">{habit.label}</h1>
            </div>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={onMinimize}
                className="p-3 md:p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                title="Minimize"
            >
                <Minimize2 size={20} />
            </button>
            <button 
                onClick={onStop}
                className="p-3 md:p-4 rounded-full bg-red-950/30 border border-red-900/50 text-red-400 hover:text-red-300 hover:bg-red-900/50 transition-all"
                title="Stop Session"
            >
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Main Timer */}
      <div className="relative z-10 flex flex-col items-center w-full px-4">
         {/* Responsive Text Size */}
         <div className="text-[22vw] md:text-[15vw] font-black text-zinc-100 tabular-nums leading-none tracking-tighter select-none">
            {formatTime(timeLeft)}
         </div>
         
         {/* Progress Bar */}
         <div className="w-full max-w-md md:max-w-lg h-1.5 md:h-2 bg-zinc-900 rounded-full mt-8 md:mt-12 overflow-hidden relative">
            <div 
                className="absolute inset-0 bg-emerald-500 transition-all duration-1000 ease-linear"
                style={{ width: `${100 - progress}%` }}
            />
         </div>
         
         <div className="mt-12 md:mt-16 flex items-center gap-8">
            <button 
                onClick={onToggle}
                className={`
                    w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300
                    ${isActive 
                        ? 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600' 
                        : 'bg-emerald-500 text-black shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-105'}
                `}
            >
                {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
         </div>
      </div>

      {/* Soundscapes */}
      <div className="absolute bottom-8 md:bottom-12 left-0 w-full flex justify-center gap-3 md:gap-4 z-20 px-4 overflow-x-auto">
         {[
             { id: 'brown', label: 'Deep', icon: Waves },
             { id: 'pink', label: 'Soft', icon: CloudRain },
             { id: 'white', label: 'Mask', icon: Wind }
         ].map((noise) => (
             <button
                key={noise.id}
                onClick={() => toggleNoise(noise.id as NoiseType)}
                className={`
                    flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl min-w-[80px] md:min-w-[100px] transition-all border
                    ${noiseEnabled && noiseType === noise.id 
                        ? 'bg-zinc-800 border-zinc-600 text-white' 
                        : 'bg-transparent border-transparent text-zinc-600 hover:text-zinc-400'}
                `}
             >
                <noise.icon size={20} />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{noise.label}</span>
             </button>
         ))}
      </div>
    </div>
  );
};
