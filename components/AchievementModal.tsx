
import React, { useEffect } from 'react';
import { Footprints, Sword, Mountain, ShieldAlert, Crown, Circle, Award, Sparkles, Star } from 'lucide-react';
import { Badge } from '../types';
import { soundService } from '../services/soundService';

declare var confetti: any;

export interface AchievementEvent {
  type: 'badge' | 'level_up';
  title: string;
  description: string;
  icon?: string;
  level?: number;
  badge?: Badge;
}

interface AchievementModalProps {
  event: AchievementEvent;
  onClose: () => void;
}

const BADGE_ICON_MAP: Record<string, React.ElementType> = {
  Footprints, Sword, Mountain, ShieldAlert, Crown, Circle
};

export const AchievementModal: React.FC<AchievementModalProps> = ({ event, onClose }) => {
  
  useEffect(() => {
    // Play sound on mount
    soundService.playLevelUp();
    
    // Trigger confetti for level ups
    if (event.type === 'level_up' && typeof confetti === 'function') {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#ec4899'], // Indigo, Purple, Pink
        zIndex: 200
      });
    }
  }, [event.type]);

  const IconComp = event.type === 'badge' && event.badge 
    ? BADGE_ICON_MAP[event.badge.icon] || Award
    : Crown;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
      {/* Global Noise Texture */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.035] bg-noise mix-blend-overlay" />

      {/* Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="relative w-full max-w-sm text-center transform animate-in zoom-in-90 slide-in-from-bottom-10 duration-500">
        
        {/* Animated Icon Container */}
        <div className="mb-8 relative inline-block">
          <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-50 animate-pulse" />
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/50 relative z-10 rotate-3 border border-white/10">
            <IconComp size={48} className="text-white drop-shadow-md" strokeWidth={2.5} />
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 text-yellow-400 animate-bounce delay-100">
             <Sparkles size={24} fill="currentColor" />
          </div>
          <div className="absolute -bottom-2 -left-4 text-yellow-400 animate-bounce delay-300">
             <Star size={20} fill="currentColor" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2 mb-8 relative z-10">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">
            {event.type === 'level_up' ? 'Level Unlocked' : 'Badge Earned'}
          </h3>
          <h2 className="text-3xl font-black text-white leading-tight">
            {event.title}
          </h2>
          <p className="text-zinc-400 px-4">
            {event.description}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-4 bg-white text-black font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all relative z-10"
        >
          Claim Reward
        </button>
      </div>
    </div>
  );
};
