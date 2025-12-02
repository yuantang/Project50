
import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, SkipForward, X, Volume2, VolumeX, ArrowRight, Trophy, Wind } from 'lucide-react';
import { UserProgress, Habit } from '../types';
import { soundService } from '../services/soundService';

declare var confetti: any;

interface FocusSessionProps {
  progress: UserProgress;
  onCompleteHabit: (habitId: string) => void;
  onClose: () => void;
}

export const FocusSession: React.FC<FocusSessionProps> = ({ progress, onCompleteHabit, onClose }) => {
  // 1. Calculate Queue
  const currentDayData = progress.history[progress.currentDay] || { completedHabits: [] };
  const incompleteHabits = progress.customHabits.filter(h => !currentDayData.completedHabits.includes(h.id));

  const [queue] = useState<Habit[]>(incompleteHabits);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionState, setSessionState] = useState<'intro' | 'active' | 'break' | 'completed'>('intro');
  const [justFinished, setJustFinished] = useState<Habit | null>(null);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(0); // 15m default?
  
  // Sound State
  const [noiseEnabled, setNoiseEnabled] = useState(false);

  // Breathing State
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('inhale');

  const currentHabit = queue[currentIndex];
  const nextHabit = queue[currentIndex + 1];

  // Cleanup on unmount
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
        soundService.playTick(); // Mechanical tick per second
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      soundService.playTimerFinished();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Breathing Logic (4-4-4-4 Box Breathing) - Robust Interval Implementation
  useEffect(() => {
    if (sessionState !== 'break') return;

    // Reset to start
    setBreathPhase('inhale');

    const phases: ('inhale' | 'hold-in' | 'exhale' | 'hold-out')[] = ['inhale', 'hold-in', 'exhale', 'hold-out'];
    let currentStep = 0;

    const interval = setInterval(() => {
        currentStep = (currentStep + 1) % 4;
        setBreathPhase(phases[currentStep]);
    }, 4000); // 4 seconds per phase

    return () => clearInterval(interval);
  }, [sessionState]);

  // Handlers
  const handleStart = () => {
    setSessionState('active');
    // Default 15 mins for generic tasks, reset timer
    const defaultTime = 15 * 60; 
    setTimeLeft(defaultTime);
    setInitialTime(defaultTime);
    soundService.playClick();
  };

  const toggleTimer = () => {
    if (isActive) {
      setIsActive(false);
      if (noiseEnabled) soundService.toggleFocusNoise(false);
    } else {
      setIsActive(true);
      if (noiseEnabled) soundService.toggleFocusNoise(true);
    }
  };

  const toggleNoise = () => {
    const newState = !noiseEnabled;
    setNoiseEnabled(newState);
    if (isActive) {
        soundService.toggleFocusNoise(newState);
    }
  };

  const handleComplete = () => {
    soundService.playComplete();
    onCompleteHabit(currentHabit.id);
    setJustFinished(currentHabit);

    // If there are more habits, go to break first
    if (currentIndex < queue.length - 1) {
        setSessionState('break');
        setIsActive(false);
        soundService.toggleFocusNoise(false); // Silence during break
    } else {
        handleNext(); // Will trigger completion
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleNext = () => {
    setIsActive(false);
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      const defaultTime = 15 * 60;
      setTimeLeft(defaultTime);
      setInitialTime(defaultTime);
      setSessionState('active');
    } else {
      setSessionState('completed');
      soundService.playSuccess();
      soundService.toggleFocusNoise(false);
      
      // Celebration Confetti
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 200,
          spread: 160,
          origin: { y: 0.6 },
          colors: ['#10b981', '#ffffff', '#34d399'],
          zIndex: 200
        });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- RENDER: INTRO ---
  if (sessionState === 'intro') {
    return (
      <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="max-w-md w-full text-center space-y-8">
           <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto border border-indigo-500/50">
             <Play size={32} className="text-indigo-400 ml-1" />
           </div>
           
           <div>
             <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Focus Session</h1>
             <p className="text-zinc-400">
               You have <span className="text-white font-bold">{queue.length} tasks</span> remaining today.
               <br />Let's execute them one by one.
             </p>
           </div>

           <div className="space-y-2">
             {queue.map((h, i) => (
               <div key={h.id} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-left opacity-60">
                 <div className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-500 font-mono">
                   {i + 1}
                 </div>
                 <span className="text-sm font-medium text-zinc-300">{h.label}</span>
               </div>
             )).slice(0, 3)}
             {queue.length > 3 && <p className="text-xs text-zinc-600">and {queue.length - 3} more...</p>}
           </div>

           <div className="flex flex-col gap-3 pt-4">
             <button 
               onClick={handleStart}
               className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-xl shadow-white/10 flex items-center justify-center gap-2"
             >
               Start Routine <ArrowRight size={18} />
             </button>
             <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm py-2">
               Cancel
             </button>
           </div>
        </div>
      </div>
    );
  }

  // --- RENDER: COMPLETED ---
  if (sessionState === 'completed') {
    return (
      <div className="fixed inset-0 z-[100] bg-emerald-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
         <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 animate-bounce">
              <Trophy size={40} className="text-black" />
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Session Complete</h1>
            <p className="text-emerald-200/80 max-w-xs mx-auto">
              You've cleared your queue. Excellent discipline.
            </p>
            <button 
               onClick={onClose}
               className="px-8 py-3 bg-white text-emerald-900 font-bold rounded-full hover:bg-emerald-50 transition-colors"
             >
               Return to Dashboard
             </button>
         </div>
      </div>
    );
  }

  // --- RENDER: BREAK (BOX BREATHING) ---
  if (sessionState === 'break') {
    let breathScale = 1;
    let breathText = "Inhale";
    let circleColor = "border-indigo-500 text-indigo-500";

    switch(breathPhase) {
      case 'inhale': 
        breathScale = 1.5; 
        breathText = "Inhale";
        circleColor = "border-indigo-400 bg-indigo-500/20";
        break;
      case 'hold-in': 
        breathScale = 1.5; 
        breathText = "Hold";
        circleColor = "border-emerald-400 bg-emerald-500/20";
        break;
      case 'exhale': 
        breathScale = 1; 
        breathText = "Exhale";
        circleColor = "border-purple-400 bg-purple-500/20";
        break;
      case 'hold-out': 
        breathScale = 1; 
        breathText = "Hold";
        circleColor = "border-zinc-400 bg-zinc-500/20";
        break;
    }

    return (
      <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
         <div className="relative z-10 max-w-md w-full text-center space-y-12">
            
            {/* Box Breathing Visualizer */}
            <div className="relative h-64 flex items-center justify-center">
               <div 
                 className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${circleColor}`}
                 style={{ transform: `scale(${breathScale})` }}
               >
                 <span className="text-xl font-bold font-serif uppercase tracking-widest text-white animate-in fade-in duration-1000 key={breathText}">
                   {breathText}
                 </span>
               </div>
               {/* Ripple Effect */}
               <div className={`absolute w-32 h-32 rounded-full border border-white/20 transition-all duration-[4000ms] ease-out ${breathPhase === 'inhale' ? 'scale-[2.5] opacity-0' : 'scale-100 opacity-0'}`} />
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-serif italic text-white tracking-wide">Box Breathing</h2>
                <p className="text-zinc-500 text-sm">Reset your mind. 4s In, 4s Hold, 4s Out, 4s Hold.</p>
                
                {nextHabit && (
                    <div className="mt-8 bg-black/40 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                        <span className="text-zinc-500 text-xs uppercase font-bold tracking-widest">Up Next</span>
                        <span className="text-white font-bold text-sm">{nextHabit.label}</span>
                    </div>
                )}
            </div>

            <button 
               onClick={handleNext}
               className="px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-zinc-200 hover:scale-105 transition-all shadow-[0_0_30px_-5px_rgba(255,255,255,0.15)]"
            >
               I'm Ready
            </button>
         </div>
      </div>
    );
  }

  // --- RENDER: ACTIVE ---
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center p-6 text-zinc-500">
         <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest">
           <span>Step {currentIndex + 1} / {queue.length}</span>
         </div>
         <button onClick={onClose} className="p-2 hover:text-white transition-colors">
           <X size={24} />
         </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
         {/* Background ambient glow */}
         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-20'}`} />

         <div className="relative z-10 text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              {currentHabit.label}
            </h2>
            
            <div 
              onClick={toggleTimer}
              className="text-[20vw] md:text-[8rem] font-black text-zinc-100 tabular-nums leading-none tracking-tighter cursor-pointer select-none hover:scale-105 active:scale-95 transition-transform"
            >
              {formatTime(timeLeft)}
            </div>

            <div className="flex justify-center gap-6">
               <button 
                 onClick={toggleTimer}
                 className={`
                   w-16 h-16 rounded-full flex items-center justify-center transition-all
                   ${isActive ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-black shadow-xl shadow-white/20'}
                 `}
               >
                 {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
               </button>
               
               <button 
                 onClick={toggleNoise}
                 className={`
                   w-16 h-16 rounded-full flex items-center justify-center transition-all border
                   ${noiseEnabled ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}
                 `}
               >
                 {noiseEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
               </button>
            </div>
         </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-6 md:p-10 border-t border-zinc-900 bg-zinc-950 flex gap-4">
         <button 
           onClick={handleSkip}
           className="flex-1 py-4 rounded-xl border border-zinc-800 text-zinc-400 font-bold hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2"
         >
           <SkipForward size={18} />
           Skip
         </button>
         <button 
           onClick={handleComplete}
           className="flex-[2] py-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
         >
           <Check size={20} strokeWidth={3} />
           Mark Complete
         </button>
      </div>
    </div>
  );
};
