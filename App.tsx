
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Settings, 
  ChartBar, 
  TriangleAlert,
  Calendar as CalendarIcon,
  LayoutDashboard,
  LifeBuoy,
  Share2,
  ChevronLeft,
  ChevronRight,
  History,
  Bot,
  MessageSquare,
  Zap,
  Snowflake,
  WifiOff,
  Cloud,
  User,
  LogOut
} from 'lucide-react';
import { UserProgress, Habit, Mood } from './types';
import { getProgress, saveProgress, startChallenge, resetChallenge, syncFromCloud } from './services/storageService';
import { getDailyMotivation, getEmergencyPepTalk } from './services/geminiService';
import { soundService } from './services/soundService';
import { checkBadges, calculateLevel } from './services/gamificationService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { HabitCard } from './components/HabitCard';
import { StatsOverview } from './components/StatsOverview';
import { DailyJournal } from './components/DailyJournal';
import { ShareCard } from './components/ShareCard';
import { FloatingTimer } from './components/FloatingTimer';
import { CalendarView } from './components/CalendarView';
import { DailyFocusCard } from './components/DailyFocusCard';
import { AchievementModal, AchievementEvent } from './components/AchievementModal';
import { Onboarding } from './components/Onboarding';
import { ShortcutsModal } from './components/ShortcutsModal';
import { SettingsView } from './components/SettingsView';
import { HabitGuideModal } from './components/HabitGuideModal';
import { AICoach } from './components/AICoach';

// Global declaration for canvas-confetti
declare var confetti: any;

type ViewState = 'dashboard' | 'calendar' | 'stats' | 'settings';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(getProgress());
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [motivation, setMotivation] = useState<string>("");
  const [loadingMotiv, setLoadingMotiv] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  
  // AI Coach Modal State (New FAB)
  const [showAICoach, setShowAICoach] = useState(false);
  
  // Privacy Blur State
  const [isBlurred, setIsBlurred] = useState(false);
  
  // SOS State
  const [showSOS, setShowSOS] = useState(false);
  const [sosMessage, setSosMessage] = useState("");
  const [loadingSOS, setLoadingSOS] = useState(false);

  // Global Timer State
  const [activeTimerHabit, setActiveTimerHabit] = useState<Habit | null>(null);
  
  // AI Guide Modal State
  const [activeGuideHabit, setActiveGuideHabit] = useState<Habit | null>(null);

  // Navigation State
  const [viewingDay, setViewingDay] = useState<number>(progress.currentDay);

  // Achievement Queue System
  const [achievementQueue, setAchievementQueue] = useState<AchievementEvent[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<AchievementEvent | null>(null);
  
  // Shortcuts
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Journal Highlight State
  const [highlightJournal, setHighlightJournal] = useState(false);

  // Network & Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userSession, setUserSession] = useState<any>(null);

  // Derived: Is "Perfect Day"? (All habits done + Journal filled + Mood selected)
  const isPerfectDay = (() => {
    const dayData = progress.history[viewingDay];
    if (!dayData) return false;
    const habitsDone = dayData.completedHabits.length === progress.customHabits.length;
    const journalDone = !!dayData.mood && !!dayData.notes && dayData.notes.trim().length > 0;
    return habitsDone && journalDone;
  })();

  // Initialize or Load Data
  useEffect(() => {
    const data = getProgress();
    if (!data.startDate) {
      const initial = startChallenge();
      setProgress(initial);
      setViewingDay(initial.currentDay);
    } else {
      setProgress(data);
      setViewingDay(data.currentDay);
    }
    // Initialize preferences
    if (data.preferences) {
      soundService.updateSettings(data.preferences.soundEnabled, data.preferences.hapticsEnabled);
    } else {
      const defaults = { soundEnabled: true, hapticsEnabled: true, notifications: { enabled: false, time: "09:00" }, privacyBlurEnabled: false };
      const newProg = { ...data, preferences: defaults };
      setProgress(newProg);
      saveProgress(newProg);
    }

    // Check for Shared Config URL Params
    const params = new URLSearchParams(window.location.search);
    const sharedConfig = params.get('config');
    if (sharedConfig) {
       try {
          const decoded = JSON.parse(atob(sharedConfig));
          if (decoded.days && decoded.habits && window.confirm(`Import Shared Challenge Protocol?\n\nDuration: ${decoded.days} Days\nHabits: ${decoded.habits.length}\nMode: ${decoded.mode || 'Standard'}\n\n⚠️ This will overwrite your current settings.`)) {
             const newProgress = { ...data, totalDays: decoded.days, customHabits: decoded.habits, strictMode: decoded.mode === 'strict' };
             setProgress(newProgress);
             saveProgress(newProgress);
             soundService.playSuccess();
             window.history.replaceState({}, document.title, window.location.pathname);
          }
       } catch (e) {
          console.error("Invalid config");
       }
    }
    
    // Setup Supabase Listener
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
         setUserSession(session);
         if (session) {
           syncFromCloud().then((cloudData) => {
             if (cloudData) {
               setProgress(cloudData);
               setViewingDay(cloudData.currentDay);
             }
           });
         }
      });
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserSession(session);
        // Re-sync on login detection
        if (_event === 'SIGNED_IN' && session) {
           syncFromCloud().then(d => d && setProgress(d));
        }
      });
      return () => subscription.unsubscribe();
    }

  }, []);

  // Network Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  }, []);

  // Privacy Blur Logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (progress.preferences?.privacyBlurEnabled) {
        if (document.hidden) {
          setIsBlurred(true);
        } else {
          setTimeout(() => setIsBlurred(false), 100);
        }
      }
    };
    
    const handleBlur = () => {
       if (progress.preferences?.privacyBlurEnabled) setIsBlurred(true);
    };
    const handleFocus = () => {
       if (progress.preferences?.privacyBlurEnabled) setIsBlurred(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [progress.preferences?.privacyBlurEnabled]);

  // Notification Scheduling Logic
  useEffect(() => {
    if (!progress.preferences?.notifications?.enabled) return;
    
    // Check permission state again to be safe
    if ('Notification' in window && Notification.permission !== 'granted') {
      return;
    }

    const checkNotificationTime = () => {
      const now = new Date();
      const timeStr = progress.preferences?.notifications?.time || "09:00";
      const [targetHours, targetMinutes] = timeStr.split(':').map(Number);
      
      if (now.getHours() === targetHours && now.getMinutes() === targetMinutes) {
        const notificationKey = `p50_notif_${now.toDateString()}`;
        if (sessionStorage.getItem(notificationKey)) return;

        const todayData = progress.history[progress.currentDay];
        const habitsCount = progress.customHabits.length;
        const completedCount = todayData?.completedHabits?.length || 0;

        if (completedCount < habitsCount) {
           try {
             new Notification(`Project ${progress.totalDays} Reminder`, {
               body: `Day ${progress.currentDay}: You have ${habitsCount - completedCount} habits remaining. Stay disciplined.`,
               icon: '/favicon.ico',
               requireInteraction: true
             });
             sessionStorage.setItem(notificationKey, 'true');
             soundService.playClick();
           } catch (e) {
             console.error("Notification failed", e);
           }
        }
      }
    };

    const interval = setInterval(checkNotificationTime, 30000);
    return () => clearInterval(interval);
  }, [progress.preferences?.notifications, progress.currentDay, progress.history, progress.customHabits, progress.totalDays]);

  // Daily Motivation Fetcher
  useEffect(() => {
    const fetchMotivation = async () => {
      setLoadingMotiv(true);
      // Pass isOnline to service? Service checks navigator.onLine itself.
      const msg = await getDailyMotivation(progress.currentDay, progress.totalDays, progress.aiPersona, progress.customPersonaPrompt);
      setMotivation(msg);
      setLoadingMotiv(false);
    };
    if (currentView === 'dashboard') {
        fetchMotivation();
    }
  }, [progress.currentDay, progress.totalDays, progress.aiPersona, currentView, isOnline]);

  // Achievement Queue Processor
  useEffect(() => {
    if (!currentAchievement && achievementQueue.length > 0) {
      setCurrentAchievement(achievementQueue[0]);
      setAchievementQueue(prev => prev.slice(1));
    }
  }, [achievementQueue, currentAchievement]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        setShowShortcuts(false);
        setShowShareCard(false);
        setActiveTimerHabit(null);
        setActiveGuideHabit(null);
        setShowSOS(false);
        setZenMode(false);
        setShowAICoach(false);
        if (currentAchievement) setCurrentAchievement(null);
        return;
      }

      if (e.key === '?' && e.shiftKey) {
        setShowShortcuts(prev => !prev);
      }

      // Shortcut: Numbers 1-9 to toggle habits in dashboard
      if (currentView === 'dashboard' && !zenMode && !showSOS && !showAICoach) {
        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 1 && num <= 9) {
          const habitIndex = num - 1;
          const habit = progress.customHabits[habitIndex];
          if (habit) {
            handleToggleHabit(habit.id);
          }
        }
      }

      // Shortcut: Cmd+Enter to highlight journal
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
         setHighlightJournal(true);
         setTimeout(() => setHighlightJournal(false), 1000);
         document.getElementById('daily-journal')?.scrollIntoView({ behavior: 'smooth' });
         const textarea = document.querySelector('#daily-journal textarea') as HTMLTextAreaElement;
         textarea?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, zenMode, showSOS, progress.customHabits, currentAchievement, showAICoach]);

  // --- Handlers ---

  const handleToggleFreeze = () => {
    if (viewingDay !== progress.currentDay) return;

    const dayData = progress.history[viewingDay] || { date: new Date().toISOString(), completedHabits: [], notes: "" };
    const isFrozen = !!dayData.frozen;
    const inventory = progress.streakFreezes || 0;

    let newHistory = { ...progress.history };
    let newInventory = inventory;

    if (!isFrozen) {
      // Consume freeze
      if (inventory > 0) {
        newInventory = inventory - 1;
        newHistory[viewingDay] = { ...dayData, frozen: true };
        soundService.playClick(); // Ice sound?
      } else {
        alert("No Streak Freezes available. Buy one in the Shop!");
        return;
      }
    } else {
      // Unfreeze (Refund)
      newInventory = inventory + 1;
      newHistory[viewingDay] = { ...dayData, frozen: false };
      soundService.playClick();
    }

    const newProgress = { ...progress, history: newHistory, streakFreezes: newInventory };
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleToggleHabit = (habitId: string) => {
    if (viewingDay > progress.currentDay) {
        alert("You cannot mark habits for future days.");
        return;
    }

    const dayData = progress.history[viewingDay] || { 
      date: new Date().toISOString(), 
      completedHabits: [], 
      notes: "",
      habitLogs: {} 
    };
    
    // Prevent modification if frozen? Optional. Usually you can still do habits even if frozen.
    
    const isCompleted = dayData.completedHabits.includes(habitId);
    let newCompletedHabits = [...dayData.completedHabits];
    
    if (isCompleted) {
      newCompletedHabits = newCompletedHabits.filter(id => id !== habitId);
    } else {
      newCompletedHabits.push(habitId);
      soundService.playComplete();
      
      // Confetti if all habits done
      if (newCompletedHabits.length === progress.customHabits.length && viewingDay === progress.currentDay) {
         if (typeof confetti === 'function') {
           confetti({
             particleCount: 100,
             spread: 70,
             origin: { y: 0.6 },
             colors: ['#10b981', '#34d399', '#059669']
           });
         }
         soundService.playSuccess();
      }
    }

    const newHistory = {
      ...progress.history,
      [viewingDay]: {
        ...dayData,
        completedHabits: newCompletedHabits
      }
    };
    
    let newXP = progress.xp;
    if (!isCompleted) newXP += 10;
    else newXP = Math.max(0, newXP - 10);
    
    const oldLevel = progress.level || 1;
    const newLevel = calculateLevel(newXP);
    if (newLevel > oldLevel) {
       setAchievementQueue(prev => [...prev, {
         type: 'level_up',
         title: `Level ${newLevel} Reached!`,
         description: 'Your discipline is growing stronger.',
         level: newLevel
       }]);
    }

    const newProgress = { 
      ...progress, 
      history: newHistory,
      xp: newXP,
      level: newLevel
    };

    const newBadges = checkBadges(newProgress);
    if (newBadges.length > (progress.badges?.length || 0)) {
       const latest = newBadges[newBadges.length - 1];
       setAchievementQueue(prev => [...prev, {
         type: 'badge',
         title: latest.label,
         description: latest.description,
         badge: latest
       }]);
    }
    newProgress.badges = newBadges;

    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleUpdateHabitLog = (habitId: string, log: string) => {
    if (viewingDay > progress.currentDay) return;

    const dayData = progress.history[viewingDay] || { date: new Date().toISOString(), completedHabits: [], notes: "", habitLogs: {} };
    const newLogs = { ...(dayData.habitLogs || {}), [habitId]: log };
    
    const newHistory = {
      ...progress.history,
      [viewingDay]: { ...dayData, habitLogs: newLogs }
    };
    
    const newProgress = { ...progress, history: newHistory };
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleMoodChange = (mood: Mood) => {
    if (viewingDay > progress.currentDay) return;

    const dayData = progress.history[viewingDay] || { date: new Date().toISOString(), completedHabits: [], notes: "" };
    const newHistory = {
      ...progress.history,
      [viewingDay]: { ...dayData, mood }
    };
    const newProgress = { ...progress, history: newHistory };
    setProgress(newProgress);
    saveProgress(newProgress);
    soundService.playClick();
  };

  const handleNoteChange = (text: string) => {
    if (viewingDay > progress.currentDay) return;

    const dayData = progress.history[viewingDay] || { date: new Date().toISOString(), completedHabits: [], notes: "" };
    const newHistory = {
      ...progress.history,
      [viewingDay]: { ...dayData, notes: text }
    };
    const newProgress = { ...progress, history: newHistory };
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handlePhotoChange = (photo: string | undefined) => {
    if (viewingDay > progress.currentDay) return;

    const dayData = progress.history[viewingDay] || { date: new Date().toISOString(), completedHabits: [], notes: "" };
    const newHistory = {
      ...progress.history,
      [viewingDay]: { ...dayData, photo }
    };
    const newProgress = { ...progress, history: newHistory };
    setProgress(newProgress);
    saveProgress(newProgress);
    if (photo) soundService.playSuccess();
  };

  const handleManifestoSave = (text: string) => {
    const newProgress = { ...progress, manifesto: text };
    setProgress(newProgress);
    saveProgress(newProgress);
    soundService.playSuccess();
  };

  const handleTimerComplete = (minutes: number, habitId: string) => {
    const currentFocus = progress.habitFocusDistribution || {};
    const newFocus = {
      ...currentFocus,
      [habitId]: (currentFocus[habitId] || 0) + minutes
    };
    
    const newProgress = {
      ...progress,
      totalFocusMinutes: (progress.totalFocusMinutes || 0) + minutes,
      habitFocusDistribution: newFocus,
      xp: progress.xp + (minutes * 2) 
    };
    
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleSOS = async () => {
    setShowSOS(true); // Ensure modal opens
    setLoadingSOS(true);
    const msg = await getEmergencyPepTalk(progress.aiPersona, progress.customPersonaPrompt);
    setSosMessage(msg);
    setLoadingSOS(false);
  };

  const handleOnboardingComplete = (name: string, manifesto: string) => {
    const newProgress = { ...progress, userName: name, manifesto: manifesto };
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleSignOut = async () => {
     if (confirm("Are you sure you want to sign out?")) {
        await supabase.auth.signOut();
        setUserSession(null);
     }
  };

  const isHistoryMode = viewingDay < progress.currentDay;
  const isFutureMode = viewingDay > progress.currentDay;
  const isFrozenDay = !!progress.history[viewingDay]?.frozen;

  if (!progress.userName && !progress.manifesto) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className={`
      min-h-screen bg-background text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200
    `}>
      {/* Network Status Bar */}
      {!isOnline && (
         <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-white text-[10px] font-bold text-center py-1 z-[60] flex items-center justify-center gap-2">
            <WifiOff size={12} />
            <span>OFFLINE MODE: AI features are limited. Data will sync when online.</span>
         </div>
      )}

      {/* Privacy Blur Overlay */}
      {isBlurred && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xl flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Settings size={48} className="mx-auto text-zinc-500 mb-4" />
            <p className="text-zinc-400 font-bold uppercase tracking-widest">Privacy Mode Active</p>
          </div>
        </div>
      )}

      {/* --- UI Overlays --- */}
      {showShareCard && <ShareCard progress={progress} onClose={() => setShowShareCard(false)} />}
      {activeTimerHabit && (
        <FloatingTimer 
          habit={activeTimerHabit} 
          onClose={() => setActiveTimerHabit(null)} 
          onTimerComplete={handleTimerComplete}
        />
      )}
      {activeGuideHabit && (
        <HabitGuideModal 
           habit={activeGuideHabit}
           onClose={() => setActiveGuideHabit(null)}
           onStartTimer={(h) => setActiveTimerHabit(h)}
        />
      )}
      {currentAchievement && (
        <AchievementModal event={currentAchievement} onClose={() => setCurrentAchievement(null)} />
      )}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      
      {/* SOS Modal */}
      {showSOS && (
        <div className="fixed inset-0 z-[60] bg-red-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="max-w-md w-full text-center space-y-6">
              <TriangleAlert size={64} className="mx-auto text-red-500 animate-pulse" />
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Emergency Protocol</h2>
              <div className="bg-black/40 border border-red-500/30 p-6 rounded-2xl min-h-[120px] flex items-center justify-center">
                 {loadingSOS ? (
                   <span className="text-red-400 animate-pulse">Contacting HQ...</span>
                 ) : (
                   <p className="text-lg md:text-xl font-bold text-red-100 leading-relaxed">"{sosMessage}"</p>
                 )}
              </div>
              <button 
                onClick={() => setShowSOS(false)} 
                className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors"
              >
                I'm Back in Control
              </button>
           </div>
        </div>
      )}

      {/* AI Coach Modal (Overlay) */}
      {showAICoach && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm"
             onClick={() => setShowAICoach(false)}
          />
          <div className="relative w-full sm:max-w-md bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-800 shadow-2xl shadow-black z-10 overflow-hidden">
             <AICoach progress={progress} onClose={() => setShowAICoach(false)} />
          </div>
        </div>
      )}

      {/* --- Main Layout --- */}
      <div className="max-w-4xl mx-auto min-h-screen flex flex-col md:border-x border-zinc-900 bg-black/50 relative">
        
        {/* Header */}
        {!zenMode && (
          <header className={`sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-zinc-800 p-4 ${!isOnline ? 'mt-6' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSOS}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors border border-red-500/20"
                  title="SOS / Panic Button"
                >
                  <LifeBuoy size={18} />
                </button>
                <div>
                  <h1 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Day {progress.currentDay}</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white">Project {progress.totalDays}</span>
                    {isHistoryMode && (
                       <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 text-[10px] font-bold rounded border border-yellow-500/30 flex items-center gap-1">
                         <History size={10} /> History
                       </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                 <button 
                   onClick={() => setShowShareCard(true)}
                   className="p-2 md:p-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-800"
                 >
                   <Share2 size={18} />
                 </button>
                 <button 
                   onClick={() => setCurrentView('settings')}
                   className={`p-2 md:p-2.5 rounded-xl transition-colors border border-zinc-800 ${currentView === 'settings' ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                 >
                   <Settings size={18} />
                 </button>
              </div>
            </div>
            
            {/* Daily Navigation Bar */}
            {currentView === 'dashboard' && (
              <div className="flex items-center gap-2 mt-4">
                 <div className="flex-1 flex items-center justify-between bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50">
                    <button 
                      onClick={() => setViewingDay(Math.max(1, viewingDay - 1))}
                      disabled={viewingDay <= 1}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className={`text-xs font-bold font-mono ${isHistoryMode ? 'text-yellow-500' : 'text-zinc-300'}`}>
                        DAY {viewingDay} {viewingDay === progress.currentDay && "(TODAY)"}
                    </span>
                    <button 
                      onClick={() => setViewingDay(Math.min(progress.totalDays, viewingDay + 1))}
                      disabled={viewingDay >= progress.totalDays}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                 </div>

                 {/* Freeze Button (Only visible today or if frozen, and if user has inventory or already frozen) */}
                 {(viewingDay === progress.currentDay) && (
                   <button
                     onClick={handleToggleFreeze}
                     disabled={!isFrozenDay && (progress.streakFreezes || 0) < 1}
                     className={`
                       h-full aspect-square flex items-center justify-center rounded-xl border transition-all
                       ${isFrozenDay 
                         ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' 
                         : (progress.streakFreezes || 0) > 0 
                           ? 'bg-zinc-900 hover:bg-cyan-950/30 text-zinc-500 hover:text-cyan-400 border-zinc-800 hover:border-cyan-500/30'
                           : 'bg-zinc-950 text-zinc-700 border-zinc-900 opacity-50 cursor-not-allowed'}
                     `}
                     title={isFrozenDay ? "Day Frozen (Streak Safe)" : `Freeze Day (Uses 1 Item). Owned: ${progress.streakFreezes || 0}`}
                   >
                     <Snowflake size={18} />
                   </button>
                 )}
              </div>
            )}
          </header>
        )}

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-6 space-y-8 overflow-y-auto overflow-x-hidden pb-32">
          
          {currentView === 'dashboard' && (
             <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                
                {/* Frozen Banner */}
                {isFrozenDay && (
                  <div className="bg-cyan-950/30 border border-cyan-500/30 p-3 rounded-xl flex items-center justify-center gap-2 animate-in fade-in">
                     <Snowflake size={14} className="text-cyan-400" />
                     <span className="text-xs font-bold text-cyan-100 uppercase tracking-wide">
                       Ice Age Mode: Streak Protected
                     </span>
                  </div>
                )}

                {/* 1. North Star / Daily Focus (Manifesto Only) */}
                {viewingDay === progress.currentDay && (
                  <DailyFocusCard 
                    manifesto={progress.manifesto || ""} 
                    onSaveManifesto={handleManifestoSave}
                    isPerfectDay={isPerfectDay}
                  />
                )}

                {/* 2. Habits Grid */}
                <div className="space-y-3">
                   <div className="flex justify-between items-end px-1">
                      <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        {isHistoryMode ? `Habits Log (Day ${viewingDay})` : "Today's Targets"}
                      </h2>
                      <div className="text-[10px] text-zinc-600 font-mono hidden md:block">
                        Press 1-{progress.customHabits.length} to toggle
                      </div>
                   </div>
                   
                   <div className="grid gap-3">
                      {progress.customHabits.map((habit, idx) => {
                        const dayData = progress.history[viewingDay];
                        const completed = dayData?.completedHabits.includes(habit.id) || false;
                        const log = dayData?.habitLogs?.[habit.id] || "";
                        
                        // Calculate Streak for this specific habit
                        let streak = 0;
                        if (completed) streak = 1; // Start with 1 if done today
                        // Count backwards
                        for(let i = viewingDay - 1; i >= 1; i--) {
                            if (progress.history[i]?.completedHabits.includes(habit.id)) streak++;
                            else break;
                        }

                        return (
                          <HabitCard 
                            key={habit.id}
                            habit={habit}
                            completed={completed}
                            log={log}
                            onToggle={handleToggleHabit}
                            onLogChange={(text) => handleUpdateHabitLog(habit.id, text)}
                            onOpenTimer={(h) => setActiveTimerHabit(h)}
                            onOpenGuide={(h) => setActiveGuideHabit(h)}
                            disabled={isFutureMode}
                            streak={streak}
                            shortcutKey={idx + 1}
                          />
                        );
                      })}
                   </div>
                </div>

                {/* 3. Journal */}
                <DailyJournal 
                   note={progress.history[viewingDay]?.notes || ""}
                   mood={progress.history[viewingDay]?.mood}
                   photo={progress.history[viewingDay]?.photo}
                   onNoteChange={handleNoteChange}
                   onMoodChange={handleMoodChange}
                   onPhotoChange={handlePhotoChange}
                   disabled={isFutureMode}
                   highlight={highlightJournal}
                />
                
                {/* 4. Daily Fuel (AI Motivation) - Bottom Footer */}
                {viewingDay === progress.currentDay && (
                  <div className="mt-8 pt-8 border-t border-zinc-800/50 text-center px-4 pb-8 relative">
                     <div className="relative z-10 flex flex-col items-center gap-3">
                        <Zap size={16} className="text-yellow-500 animate-pulse" fill="currentColor" />
                        {loadingMotiv ? (
                          <div className="flex gap-1 justify-center">
                             <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" />
                             <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce delay-100" />
                             <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce delay-200" />
                          </div>
                        ) : (
                          <p className="font-serif italic text-lg text-zinc-400 max-w-lg leading-relaxed tracking-wide">
                            "{motivation}"
                          </p>
                        )}
                        <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold mt-2">Daily Fuel</p>
                     </div>
                  </div>
                )}
             </div>
          )}

          {currentView === 'stats' && (
             <StatsOverview progress={progress} onUpdateProgress={setProgress} />
          )}

          {currentView === 'calendar' && (
             <CalendarView progress={progress} onDayClick={(d) => { setViewingDay(d); setCurrentView('dashboard'); }} />
          )}

          {currentView === 'settings' && (
             <SettingsView 
               progress={progress} 
               onUpdate={setProgress} 
               onReset={() => { resetChallenge(); window.location.reload(); }}
               userSession={userSession}
               onLogoutRequest={handleSignOut}
             />
          )}

        </main>

        {/* FAB: AI Coach Trigger */}
        {!zenMode && currentView === 'dashboard' && (
          <button
            onClick={() => setShowAICoach(true)}
            className="fixed bottom-24 right-4 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-110 active:scale-95 transition-all border border-indigo-500/50 group"
          >
            <MessageSquare size={24} fill="currentColor" />
            
            {/* Pulse Effect */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>

            {/* Label Tooltip */}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-zinc-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
               AI Coach
            </span>
          </button>
        )}

        {/* Bottom Nav */}
        {!zenMode && (
          <nav className="sticky bottom-0 z-40 bg-background/90 backdrop-blur-lg border-t border-zinc-800 safe-area-bottom">
            <div className="flex justify-around items-center p-2">
               <button 
                 onClick={() => { setCurrentView('dashboard'); setViewingDay(progress.currentDay); }}
                 className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentView === 'dashboard' ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 <LayoutDashboard size={20} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
                 <span className="text-[10px] font-bold">Today</span>
               </button>
               <button 
                 onClick={() => setCurrentView('calendar')}
                 className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentView === 'calendar' ? 'text-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 <CalendarIcon size={20} strokeWidth={currentView === 'calendar' ? 2.5 : 2} />
                 <span className="text-[10px] font-bold">Log</span>
               </button>
               <button 
                 onClick={() => setCurrentView('stats')}
                 className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentView === 'stats' ? 'text-purple-500' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 <ChartBar size={20} strokeWidth={currentView === 'stats' ? 2.5 : 2} />
                 <span className="text-[10px] font-bold">Stats</span>
               </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
