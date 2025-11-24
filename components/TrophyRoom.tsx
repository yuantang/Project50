
import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { UserProgress } from '../types';
import { AVAILABLE_BADGES } from '../services/gamificationService';
import { ChevronDown, ChevronUp, Award } from 'lucide-react';

interface TrophyRoomProps {
  progress: UserProgress;
}

export const TrophyRoom: React.FC<TrophyRoomProps> = ({ progress }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to determine next level progress
  const currentXP = progress.xp || 0;
  const currentLevel = progress.level || 1;
  const nextLevelXP = Math.pow(currentLevel, 2) * 100; // Inverse of level calc
  const prevLevelXP = Math.pow(currentLevel - 1, 2) * 100;
  const progressToNext = ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;

  const unlockedCount = progress.badges?.length || 0;
  const totalBadges = AVAILABLE_BADGES.length;

  return (
    <div className="bg-surface border border-zinc-800 rounded-xl p-4 md:p-5 transition-all shadow-sm">
      {/* Compact Header Row */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
        
        {/* Level & Progress (Always Visible) */}
        <div className="flex items-center gap-4 flex-1">
          <div className="relative shrink-0">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg border-2 border-surface">
              {currentLevel}
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-zinc-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-zinc-700 text-zinc-400">
              LVL
            </div>
          </div>
          
          <div className="flex-1 min-w-[120px]">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white font-bold tracking-wide">Discipline Rank</span>
              <span className="text-zinc-500 font-mono">{Math.floor(currentXP)} <span className="text-zinc-700">/</span> {nextLevelXP} XP</span>
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 relative"
                style={{ width: `${Math.min(100, Math.max(0, progressToNext))}%` }}
              >
                <div className="absolute inset-0 bg-white/10" />
              </div>
            </div>
          </div>
        </div>

        {/* Divider for Desktop */}
        <div className="hidden md:block w-px h-10 bg-zinc-800" />

        {/* Quick Badge Preview or Toggle */}
        <div className="flex items-center justify-between gap-4 md:w-auto">
           {/* Mini Preview of unlocked icons (max 5) */}
           {!isExpanded && (
             <div className="flex -space-x-2 overflow-hidden py-1">
               {AVAILABLE_BADGES.map(badge => {
                 const isUnlocked = progress.badges?.some(b => b.id === badge.id);
                 if (!isUnlocked) return null;
                 const IconComp = (Icons as any)[badge.icon] || Icons.Circle;
                 return (
                   <div key={badge.id} className={`w-8 h-8 rounded-full border-2 border-surface bg-zinc-800 flex items-center justify-center ${badge.color}`} title={badge.label}>
                     <IconComp size={14} />
                   </div>
                 )
               }).slice(0, 5)}
               {unlockedCount === 0 && <span className="text-xs text-zinc-600 italic">No badges yet</span>}
               {unlockedCount > 5 && (
                 <div className="w-8 h-8 rounded-full border-2 border-surface bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">
                   +{unlockedCount - 5}
                 </div>
               )}
             </div>
           )}

           <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-400 transition-colors whitespace-nowrap ml-auto md:ml-0"
          >
            {isExpanded ? 'Collapse' : 'View Achievements'}
            <div className="flex items-center justify-center w-5 h-5 bg-zinc-800 rounded text-[10px] ml-1">
              {unlockedCount}/{totalBadges}
            </div>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expandable Grid */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-zinc-800/50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {AVAILABLE_BADGES.map((badge) => {
              const isUnlocked = progress.badges?.some(b => b.id === badge.id);
              const IconComp = (Icons as any)[badge.icon] || Icons.Circle;

              return (
                <div 
                  key={badge.id}
                  className={`
                    relative group p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all duration-300
                    ${isUnlocked 
                      ? 'bg-zinc-900 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800' 
                      : 'bg-zinc-950/50 border-zinc-800/50 grayscale opacity-40'}
                  `}
                >
                  <div className={`
                    p-2.5 rounded-full bg-zinc-800 
                    ${isUnlocked ? badge.color : 'text-zinc-600'}
                    ${isUnlocked ? 'shadow-md shadow-black/50' : ''}
                  `}>
                    <IconComp size={20} />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center">
                      <p className={`text-[10px] font-bold uppercase tracking-wide ${isUnlocked ? 'text-zinc-200' : 'text-zinc-600'}`}>
                        {badge.label}
                      </p>
                      {/* Tooltip description visible on hover */}
                      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm rounded-xl flex items-center justify-center p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-zinc-700">
                        <p className="text-[10px] text-zinc-300 leading-tight">{badge.description}</p>
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
