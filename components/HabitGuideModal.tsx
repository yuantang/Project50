
import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Loader2, Play } from 'lucide-react';
import { Habit } from '../types';
import { getHabitGuide } from '../services/geminiService';

interface HabitGuideModalProps {
  habit: Habit;
  onClose: () => void;
  onStartTimer: (habit: Habit) => void;
}

export const HabitGuideModal: React.FC<HabitGuideModalProps> = ({ habit, onClose, onStartTimer }) => {
  const [guide, setGuide] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      setLoading(true);
      const result = await getHabitGuide(habit.label, habit.description);
      setGuide(result);
      setLoading(false);
    };
    fetchGuide();
  }, [habit]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-6 border-b border-white/5">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
               <Lightbulb className="text-yellow-400" size={24} />
             </div>
             <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
               <X size={20} />
             </button>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{habit.label}</h2>
          <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">AI Execution Guide</p>
        </div>

        {/* Content */}
        <div className="p-6">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-8 gap-3 text-zinc-500">
               <Loader2 className="animate-spin text-indigo-500" size={24} />
               <p className="text-xs">Generating tactical plan...</p>
             </div>
           ) : (
             <div className="space-y-4">
                <div className="prose prose-invert prose-sm">
                   <div className="whitespace-pre-line text-zinc-300 leading-relaxed font-medium">
                     {guide}
                   </div>
                </div>
                
                <div className="pt-4 mt-4 border-t border-zinc-800">
                   <button 
                     onClick={() => {
                       onStartTimer(habit);
                       onClose();
                     }}
                     className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/20"
                   >
                     <Play size={16} fill="currentColor" />
                     Execute Now
                   </button>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
