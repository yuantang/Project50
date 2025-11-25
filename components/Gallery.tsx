
import React, { useState } from 'react';
import { UserProgress } from '../types';
import { ImageIcon, AlignLeft, Calendar, Quote } from 'lucide-react';

interface GalleryProps {
  progress: UserProgress;
}

export const Gallery: React.FC<GalleryProps> = ({ progress }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  const validDays = Object.keys(progress.history)
    .map(key => Number(key))
    .sort((a, b) => b - a); // Newest first

  const photoDays = validDays.filter(day => progress.history[day]?.photo);
  const journalDays = validDays.filter(day => progress.history[day]?.notes);

  if (validDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
        <div className="p-4 bg-zinc-900 rounded-full mb-3 shadow-inner">
           <ImageIcon size={24} className="opacity-50" />
        </div>
        <p className="text-sm font-medium">Your gallery is empty</p>
        <p className="text-xs opacity-50 mt-1">Start tracking to see your journey unfold.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="flex p-1 bg-zinc-900 rounded-lg border border-zinc-800">
          <button 
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Photo Grid"
          >
            <ImageIcon size={14} />
            <span>Grid</span>
          </button>
          <button 
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'timeline' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Journal Timeline"
          >
            <AlignLeft size={14} />
            <span>Timeline</span>
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        // PHOTO GRID
        photoDays.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in zoom-in-95 duration-300">
            {photoDays.map(day => {
              const entry = progress.history[day];
              return (
                <div key={day} className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-lg cursor-pointer">
                  <img 
                    src={entry.photo} 
                    alt={`Day ${day}`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                  
                  <div className="absolute bottom-0 left-0 w-full p-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">Day {day}</p>
                        <p className="text-white text-xs opacity-80 line-clamp-1 font-medium">{new Date(entry.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {entry.notes && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <p className="text-[10px] text-zinc-300 line-clamp-2 italic">
                          "{entry.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-sm">No photos uploaded yet.</p>
          </div>
        )
      ) : (
        // TIMELINE LIST
        journalDays.length > 0 ? (
          <div className="space-y-4 relative animate-in slide-in-from-right-4 duration-300">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-zinc-800" />
            {journalDays.map(day => {
              const entry = progress.history[day];
              return (
                <div key={day} className="relative pl-12 group">
                  {/* Timeline Dot */}
                  <div className="absolute left-0 top-0 w-10 h-10 flex items-center justify-center bg-surface border border-zinc-800 rounded-full z-10 group-hover:border-zinc-600 transition-colors">
                    <span className="text-xs font-bold text-zinc-400 font-mono">{day}</span>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:bg-zinc-900 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-zinc-500" />
                          <span className="text-xs text-zinc-400 font-medium">{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                       </div>
                       {entry.mood && (
                         <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                           {entry.mood}
                         </span>
                       )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                       <div className="flex-1">
                          <Quote size={16} className="text-zinc-700 mb-2" />
                          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line font-serif">
                            {entry.notes}
                          </p>
                       </div>
                       {entry.photo && (
                         <div className="w-full sm:w-24 h-32 sm:h-24 shrink-0 rounded-lg overflow-hidden border border-zinc-800">
                           <img src={entry.photo} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-sm">No journal entries yet.</p>
          </div>
        )
      )}
    </div>
  );
};
