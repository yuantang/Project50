
import React from 'react';
import { UserProgress } from '../types';
import { Calendar, ImageIcon } from 'lucide-react';

interface GalleryProps {
  progress: UserProgress;
}

export const Gallery: React.FC<GalleryProps> = ({ progress }) => {
  // Extract days that have photos
  const photoDays = Object.keys(progress.history)
    .map(key => Number(key))
    .sort((a, b) => b - a) // Newest first
    .filter(day => progress.history[day]?.photo);

  if (photoDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
        <div className="p-4 bg-zinc-900 rounded-full mb-3">
           <ImageIcon size={24} className="opacity-50" />
        </div>
        <p className="text-sm">No photos yet.</p>
        <p className="text-xs opacity-50">Upload daily evidence to see your transformation here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photoDays.map(day => {
          const entry = progress.history[day];
          return (
            <div key={day} className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-lg">
              <img 
                src={entry.photo} 
                alt={`Day ${day}`} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute bottom-0 left-0 w-full p-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Day {day}</p>
                    <p className="text-white text-xs opacity-80 line-clamp-1">{new Date(entry.date).toLocaleDateString()}</p>
                  </div>
                </div>
                {entry.notes && (
                  <p className="text-[10px] text-zinc-400 mt-2 line-clamp-2 border-l-2 border-zinc-700 pl-2">
                    {entry.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
