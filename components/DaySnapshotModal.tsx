import React from 'react';
import { DayData, Habit } from '../types';
import { X, Calendar, Quote, CheckCircle2, Circle, ImageIcon, Smile, Frown, Meh, Zap } from 'lucide-react';

interface DaySnapshotModalProps {
  day: number;
  data: DayData;
  habits: Habit[];
  onClose: () => void;
}

export const DaySnapshotModal: React.FC<DaySnapshotModalProps> = ({ day, data, habits, onClose }) => {
  const completionCount = data.completedHabits.length;
  const totalHabits = habits.length;
  const percentage = Math.round((completionCount / totalHabits) * 100);

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'great': return <Zap size={16} className="text-emerald-400" />;
      case 'good': return <Smile size={16} className="text-blue-400" />;
      case 'neutral': return <Meh size={16} className="text-yellow-400" />;
      case 'bad': return <Meh size={16} className="text-orange-400" />;
      case 'terrible': return <Frown size={16} className="text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Global Noise Texture */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.035] bg-noise mix-blend-overlay" />

      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col z-10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-zinc-800 text-white rounded-full backdrop-blur-sm transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header Image or Gradient */}
        <div className="h-48 shrink-0 relative bg-zinc-900">
           {data.photo ? (
             <img src={data.photo} alt={`Day ${day}`} className="w-full h-full object-cover opacity-80" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-gradient-to-b from-zinc-900 to-zinc-950">
                <ImageIcon size={48} className="opacity-20" />
             </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
           
           <div className="absolute bottom-4 left-6">
              <p className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest mb-1">Day {day}</p>
              <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                {new Date(data.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </h2>
           </div>
        </div>

        {/* Content Scrollable Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
           
           {/* Note & Mood */}
           {(data.notes || data.mood) && (
             <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl relative">
                {data.notes && (
                  <>
                    <Quote size={20} className="text-zinc-700 absolute top-3 left-3" />
                    <p className="text-zinc-300 text-sm leading-relaxed pl-6 italic font-serif">"{data.notes}"</p>
                  </>
                )}
                {data.mood && (
                   <div className={`flex justify-end ${data.notes ? 'mt-3 pt-3 border-t border-zinc-800/50' : ''}`}>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 rounded-lg border border-zinc-800/50">
                        {getMoodIcon(data.mood)}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{data.mood}</span>
                      </div>
                   </div>
                )}
             </div>
           )}

           {/* Habit List */}
           <div>
              <div className="flex justify-between items-end mb-3">
                 <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Habit Log</h3>
                 <span className={`text-xs font-bold ${percentage === 100 ? 'text-emerald-400' : 'text-zinc-400'}`}>{percentage}% Complete</span>
              </div>
              <div className="space-y-2">
                 {habits.map(h => {
                    const isDone = data.completedHabits.includes(h.id);
                    const log = data.habitLogs?.[h.id];
                    
                    return (
                       <div key={h.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${isDone ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-zinc-900/30 border-zinc-800/50'}`}>
                          <div className={`mt-0.5 ${isDone ? 'text-emerald-500' : 'text-zinc-700'}`}>
                             {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className={`text-sm font-medium ${isDone ? 'text-zinc-200' : 'text-zinc-500 line-through decoration-zinc-700'}`}>{h.label}</p>
                             {log && <p className="text-xs text-zinc-400 mt-1 italic border-l-2 border-zinc-700 pl-2">"{log}"</p>}
                          </div>
                       </div>
                    )
                 })}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};