
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Settings, 
  ChartBar, 
  AlertCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  LayoutDashboard,
  LifeBuoy,
  Snowflake,
  Sun,
  Moon,
  Sunset,
  Eye,
  EyeOff,
  Share2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { DEFAULT_HABITS, UserProgress, DayData, Habit, Mood } from './types';
import { getProgress, saveProgress, startChallenge, resetChallenge } from './services/storageService';
import { getDailyMotivation, getEmergencyPepTalk } from './services/geminiService';
import { soundService } from './services/soundService';
import { checkBadges, calculateDailyXP, calculateLevel } from './services/gamificationService';
import { HabitCard } from './components/HabitCard';
import { StatsOverview } from './components/StatsOverview';
import { DailyJournal } from './components/DailyJournal';
import { ShareCard } from './components/ShareCard';
import { FloatingTimer } from './components/FloatingTimer';
import { CalendarView } from './components/CalendarView';
import { ManifestoCard } from './components/ManifestoCard';
import { AchievementModal, AchievementEvent } from './components/AchievementModal';
import { Onboarding } from './components/Onboarding';
import { ShortcutsModal } from './components/ShortcutsModal';
import { SettingsView } from './components/SettingsView';

// Global declaration for canvas-confetti
declare var confetti: any;

type ViewState = 'dashboard' | 'calendar' | 'stats' | 'settings';

function App() {
  const [progress, setProgress] = useState<UserProgress>(getProgress());
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [motivation, setMotivation] = useState<string>("");
  const [loadingMotiv, setLoadingMotiv] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  
  // SOS State
  const [showSOS, setShowSOS] = useState(false);
  const [sosMessage, setSosMessage] = useState("");
  const [loadingSOS, setLoadingSOS] = useState(false);

  // Global Timer State
  const [activeTimerHabit, setActiveTimerHabit] = useState<Habit | null>(null);

  // Navigation State
  const [viewingDay, setViewingDay] = useState<number>(progress.currentDay);

  // Achievement Queue System
  const [achievementQueue, setAchievementQueue] = useState<AchievementEvent[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<AchievementEvent | null>(null);
  
  // Shortcuts
  const [showShortcuts, setShowShortcuts] = useState(false);

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
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Habit Toggles (1-9)
      const key = parseInt(e.key);
      if (!isNaN(key) && key >= 1 && key <= 9) {
        // Adjust for 0-based index
        const index = key - 1;
        if (progress.customHabits[index]) {
          handleToggleHabit(progress.customHabits[index].id);
        }
      }

      // Complete Day (Cmd+Enter or Ctrl+Enter)
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleFinishDay();
      }

      // Help
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [progress, viewingDay]);

  // Process Achievement Queue
  useEffect(() => {
    if (!currentAchievement && achievementQueue.length > 0) {
      const next = achievementQueue[0];
      setCurrentAchievement(next);
      setAchievementQueue(prev => prev.slice(1));
    }
  }, [currentAchievement, achievementQueue]);

  // Fetch Motivation on Mount
  useEffect(() => {
    const fetchMotivation = async () => {
      if (progress.startDate) {
        setLoadingMotiv(true);
        const quote = await getDailyMotivation(progress.currentDay, progress.totalDays, progress.aiPersona);
        setMotivation(quote);
        setLoadingMotiv(false);
      }
    };
    fetchMotivation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.currentDay, progress.aiPersona]);

  // Time-based Greeting Helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return { text: "Late Night Grind", icon: Moon };
    if (hour < 12) return { text: "Good Morning", icon: Sun };
    if (hour < 18) return { text: "Keep Pushing", icon: Sun };
    return { text: "Good Evening", icon: Sunset };
  };

  const greeting = getGreeting();

  const handleToggleHabit = (habitId: string) => {
    // Prevent editing past days
    if (viewingDay !== progress.currentDay) return;

    soundService.playClick();

    const currentDayNum = progress.currentDay;
    const currentHistory = progress.history[currentDayNum] || { 
      date: new Date().toISOString(), 
      completedHabits: [], 
      notes: '' 
    };

    const isCompleted = currentHistory.completedHabits.includes(habitId);
    let newCompletedHabits = [];
    
    if (isCompleted) {
      newCompletedHabits = currentHistory.completedHabits.filter(id => id !== habitId);
    } else {
      newCompletedHabits = [...currentHistory.completedHabits, habitId];
      soundService.playComplete();
    }

    const newHistoryEntry: DayData = {
      ...currentHistory,
      completedHabits: newCompletedHabits,
    };

    const newProgress = {
      ...progress,
      history: {
        ...progress.history,
        [currentDayNum]: newHistoryEntry
      }
    };

    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleUpdateNotes = (text: string) => {
    if (viewingDay !== progress.currentDay) return;
    updateDayData('notes', text);
  };

  const handleUpdateMood = (mood: Mood) => {
    if (viewingDay !== progress.currentDay) return;
    updateDayData('mood', mood);
  };

  const handleUpdatePhoto = (photo: string | undefined) => {
    if (viewingDay !== progress.currentDay) return;
    updateDayData('photo', photo);
  };

  const handleSaveManifesto = (text: string) => {
    const newProgress = { ...progress, manifesto: text };
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleOnboardingComplete = (name: string, manifesto: string) => {
    const newProgress = { 
      ...progress, 
      userName: name, 
      manifesto: manifesto,
      startDate: new Date().toISOString() // Start timer now
    };
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleTimerComplete = (minutes: number, habitId: string) => {
    const newTotal = (progress.totalFocusMinutes || 0) + minutes;
    const currentDist = progress.habitFocusDistribution || {};
    const newDist = {
      ...currentDist,
      [habitId]: (currentDist[habitId] || 0) + minutes
    };

    const newProgress = { 
      ...progress, 
      totalFocusMinutes: newTotal,
      habitFocusDistribution: newDist 
    };
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const updateDayData = (key: keyof DayData, value: any) => {
    const currentDayNum = progress.currentDay;
    const currentHistory = progress.history[currentDayNum] || { 
      date: new Date().toISOString(), 
      completedHabits: [], 
      notes: '' 
    };

    const newHistoryEntry: DayData = {
      ...currentHistory,
      [key]: value,
    };

    const newProgress = {
      ...progress,
      history: {
        ...progress.history,
        [currentDayNum]: newHistoryEntry
      }
    };

    setProgress(newProgress);
    saveProgress(newProgress);
  }

  const handleFinishDay = () => {
    if (viewingDay !== progress.currentDay) return; 

    if (progress.currentDay >= progress.totalDays) {
      setAchievementQueue(prev => [...prev, {
        type: 'level_up',
        title: 'Project Completed',
        description: 'You have finished the 50 day challenge. You are now elite.',
        icon: 'Crown'
      }]);
      return;
    }

    const todayData = progress.history[progress.currentDay] || { date: new Date().toISOString(), completedHabits: [], notes: '' };
    const completedCount = todayData.completedHabits.length;
    const totalHabits = progress.customHabits.length;

    let dayFrozen = false;

    if (completedCount < totalHabits) {
      // Logic for Streak Freeze
      if (progress.streakFreezes > 0) {
        soundService.playClick();
        const useFreeze = window.confirm(`You haven't finished all habits. You have ${progress.streakFreezes} Streak Freeze(s). Use one to save your streak?`);
        if (useFreeze) {
          dayFrozen = true;
        } else if (progress.strictMode) {
           soundService.playError();
           if (window.confirm("STRICT MODE: Failing this day will reset progress to Day 1. Confirm?")) {
             const restart = startChallenge(progress.totalDays, progress.customHabits);
             restart.strictMode = true; 
             restart.manifesto = progress.manifesto;
             restart.userName = progress.userName;
             restart.streakFreezes = progress.streakFreezes;
             restart.aiPersona = progress.aiPersona;
             setProgress(restart);
             setViewingDay(1);
             saveProgress(restart);
             alert("Reset to Day 1.");
           }
           return;
        } else {
           if (!window.confirm("Mark day as incomplete and break streak?")) return;
        }
      } else if (progress.strictMode) {
          soundService.playError();
          if (window.confirm("STRICT MODE: Failing this day will reset progress to Day 1. Confirm?")) {
             const restart = startChallenge(progress.totalDays, progress.customHabits);
             restart.strictMode = true; 
             restart.manifesto = progress.manifesto;
             restart.userName = progress.userName;
             restart.streakFreezes = progress.streakFreezes;
             restart.aiPersona = progress.aiPersona;
             setProgress(restart);
             setViewingDay(1);
             saveProgress(restart);
             alert("Reset to Day 1.");
           }
           return;
      } else {
         if (!window.confirm("Mark day as incomplete?")) return;
      }
    } else {
      soundService.playSuccess();
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }

    // Calculate Rewards
    let xpEarned = calculateDailyXP(completedCount, totalHabits);
    if (dayFrozen) xpEarned = Math.floor(xpEarned / 2); // Penalty for freezing

    const newXP = (progress.xp || 0) + xpEarned;
    const newLevel = calculateLevel(newXP);
    
    const nextDay = progress.currentDay + 1;
    const progressForBadges = { ...progress, currentDay: nextDay, xp: newXP, level: newLevel };
    const newBadges = checkBadges(progressForBadges);
    
    if (newLevel > (progress.level || 1)) {
       setAchievementQueue(prev => [...prev, {
         type: 'level_up',
         title: `Level ${newLevel}`,
         description: 'Your discipline is growing stronger.',
         level: newLevel
       }]);
    }

    newBadges.forEach(badge => {
      setAchievementQueue(prev => [...prev, {
        type: 'badge',
        title: badge.label,
        description: badge.description,
        badge: badge
      }]);
    });

    const newProgress = {
      ...progress,
      currentDay: nextDay,
      xp: newXP,
      level: newLevel,
      badges: [...(progress.badges || []), ...newBadges],
      streakFreezes: dayFrozen ? progress.streakFreezes - 1 : progress.streakFreezes,
      history: {
        ...progress.history,
        [progress.currentDay]: {
          ...todayData,
          frozen: dayFrozen
        }
      },
      habitFocusDistribution: progress.habitFocusDistribution || {}
    };
    
    setProgress(newProgress);
    setViewingDay(nextDay);
    saveProgress(newProgress);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
      const fresh = resetChallenge();
      const started = startChallenge(50, DEFAULT_HABITS);
      setProgress(started);
      setViewingDay(1);
      setCurrentView('dashboard');
  };

  const handleUpdateProgress = (newProgress: UserProgress) => {
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleSOS = async () => {
    setShowSOS(true);
    setSosMessage("");
    setLoadingSOS(true);
    const talk = await getEmergencyPepTalk(progress.aiPersona);
    setSosMessage(talk);
    setLoadingSOS(false);
  };

  // Helper to change viewing day
  const changeDay = (delta: number) => {
    const newDay = viewingDay + delta;
    if (newDay >= 1 && newDay <= progress.totalDays) {
      setViewingDay(newDay);
      soundService.playClick();
    }
  };

  const handleCalendarDayClick = (day: number) => {
    setViewingDay(day);
    setCurrentView('dashboard');
  };

  const getHabitStreak = (habitId: string) => {
    let streak = 0;
    const currentCheckDay = progress.currentDay;
    const todayData = progress.history[currentCheckDay];
    if (todayData && (todayData.completedHabits.includes(habitId) || todayData.frozen)) {
       streak++;
    }
    for (let i = currentCheckDay - 1; i >= 1; i--) {
      const data = progress.history[i];
      if (data && (data.completedHabits.includes(habitId) || data.frozen)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const NavButton = ({ active, onClick, icon: Icon, label, mobile }: any) => (
    <button
      onClick={() => { soundService.playClick(); onClick(); }}
      className={`
        flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group relative
        ${active 
          ? 'bg-zinc-800 text-white shadow-lg shadow-black/20' 
          : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}
        ${mobile ? 'flex-col gap-1 p-2' : 'w-full'}
      `}
    >
      <div className={`relative ${active ? 'text-emerald-500' : ''}`}>
         <Icon size={mobile ? 20 : 22} />
         {active && <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full" />}
      </div>
      {label && <span className={`font-medium text-sm ${mobile ? 'text-[10px]' : ''}`}>{label}</span>}
      {active && !mobile && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-l-full" />}
    </button>
  );

  const viewingDayData = progress.history[viewingDay] || { date: new Date().toISOString(), completedHabits: [], notes: '', mood: undefined, photo: undefined };
  const isCurrentDay = viewingDay === progress.currentDay;
  const isFutureDay = viewingDay > progress.currentDay;
  const dailyProgressPercent = Math.round((viewingDayData.completedHabits.length / progress.customHabits.length) * 100) || 0;

  if (!progress.userName) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pl-20 relative">
      {/* Achievement Modal Overlay */}
      {currentAchievement && (
        <AchievementModal 
          event={currentAchievement} 
          onClose={() => setCurrentAchievement(null)} 
        />
      )}
      
      {/* Shortcuts Help Modal */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* Share Modal */}
      {showShareCard && (
        <ShareCard progress={progress} onClose={() => setShowShareCard(false)} />
      )}

      {/* SOS Modal */}
      {showSOS && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-md animate-in fade-in">
           <div className="max-w-md w-full bg-black border border-red-500/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
             <button onClick={() => setShowSOS(false)} className="absolute top-4 right-4 text-red-500/60 hover:text-red-400">
               <AlertCircle size={24} />
             </button>
             
             <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <AlertTriangle className="text-black" size={32} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Emergency Protocol</h2>
                <p className="text-red-400 text-xs font-mono mt-2">REBOOTING MENTAL STATE...</p>
             </div>
             
             <div className="bg-red-950/30 border border-red-900/50 p-6 rounded-xl min-h-[150px] flex items-center justify-center">
                {loadingSOS ? (
                  <div className="text-red-500 animate-pulse font-mono">ESTABLISHING CONNECTION...</div>
                ) : (
                  <p className="text-lg text-white font-medium leading-relaxed font-serif text-center">
                    "{sosMessage}"
                  </p>
                )}
             </div>

             <button 
               onClick={() => setShowSOS(false)} 
               className="w-full mt-6 bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors uppercase tracking-widest"
             >
               I Will Not Quit
             </button>
           </div>
        </div>
      )}

      {/* Global Floating Timer - Persists across views */}
      <FloatingTimer 
        habit={activeTimerHabit} 
        onClose={() => setActiveTimerHabit(null)} 
        onTimerComplete={handleTimerComplete}
      />

      {/* Sidebar Navigation (Desktop) */}
      {!zenMode && (
        <div className="hidden md:flex fixed left-0 top-0 h-full w-20 bg-surface border-r border-zinc-800 flex-col items-center py-8 z-40">
          <div className="mb-12">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-black text-xl shadow-lg shadow-emerald-500/20">
              {progress.userName.charAt(0).toUpperCase()}
            </div>
          </div>
          <nav className="flex-1 flex flex-col gap-8 w-full">
            <NavButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={LayoutDashboard} label="Track" />
            <NavButton active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} icon={CalendarIcon} label="Plan" />
            <NavButton active={currentView === 'stats'} onClick={() => setCurrentView('stats')} icon={ChartBar} label="Stats" />
            <NavButton active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={Settings} label="Settings" />
          </nav>
        </div>
      )}

      {/* Bottom Navigation (Mobile) */}
      {!zenMode && (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur border-t border-zinc-800 flex justify-around p-4 z-40">
            <NavButton mobile active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={LayoutDashboard} label="" />
            <NavButton mobile active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} icon={CalendarIcon} label="" />
            <NavButton mobile active={currentView === 'stats'} onClick={() => setCurrentView('stats')} icon={ChartBar} label="" />
            <NavButton mobile active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={Settings} label="" />
        </div>
      )}

      {/* Main Content Area */}
      <main className={`max-w-4xl mx-auto p-6 md:p-12 ${zenMode ? 'md:pl-6' : ''}`}>
        {/* Header Section */}
        <header className="mb-8">
          {/* Zen Mode Toggle (Always visible on dashboard) */}
          {currentView === 'dashboard' && (
             <div className="flex justify-between items-center mb-4">
               {zenMode && <h2 className="text-white font-bold opacity-50 text-sm">ZEN MODE ACTIVE</h2>}
               <div className="ml-auto">
                 <button 
                    onClick={() => setZenMode(!zenMode)} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${zenMode ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-white'}`}
                    title="Toggle Zen Mode (Hide distractions)"
                 >
                   {zenMode ? <EyeOff size={14} /> : <Eye size={14} />}
                   {zenMode ? 'Exit Zen' : 'Zen Mode'}
                 </button>
               </div>
             </div>
          )}

          {/* Manifesto Card - Hidden in Zen Mode */}
          {currentView === 'dashboard' && !zenMode && (
            <ManifestoCard 
              text={progress.manifesto || ""} 
              onSave={handleSaveManifesto} 
            />
          )}

          {currentView !== 'settings' && !zenMode && (
          <div className="flex justify-between items-end mb-4">
            <div>
              {/* Dynamic Greeting */}
              {currentView === 'dashboard' && isCurrentDay && (
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1 animate-in fade-in slide-in-from-left-2">
                   <greeting.icon size={14} className="text-zinc-400" />
                   <span>{greeting.text}, {progress.userName.split(' ')[0]}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                 <h1 className="text-4xl font-bold text-white mb-2">Project {progress.totalDays}</h1>
                 {/* SOS Button */}
                 <button 
                   onClick={handleSOS}
                   className="mb-2 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full border border-red-500/30 transition-colors"
                   title="I'm struggling (Panic Button)"
                 >
                   <LifeBuoy size={20} />
                 </button>
                 
                 {/* Streak Freeze Indicator */}
                 {progress.streakFreezes > 0 && (
                   <div 
                     className="mb-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400" 
                     title={`${progress.streakFreezes} Streak Freezes Available`}
                   >
                     <Snowflake size={20} />
                   </div>
                 )}
              </div>
              
              <div className="flex items-center gap-3 text-zinc-400">
                {currentView === 'dashboard' ? (
                  <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                    <button 
                      onClick={() => changeDay(-1)}
                      disabled={viewingDay <= 1}
                      className="p-1 hover:bg-zinc-800 rounded-md disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="mx-3 font-mono font-medium text-white w-20 text-center">
                      Day {viewingDay}
                    </span>
                    <button 
                      onClick={() => changeDay(1)}
                      disabled={viewingDay >= progress.totalDays}
                      className="p-1 hover:bg-zinc-800 rounded-md disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                ) : (
                  <span>Day {progress.currentDay} of {progress.totalDays}</span>
                )}
                
                {currentView === 'dashboard' && isCurrentDay && (
                  <button 
                    onClick={() => setShowShareCard(true)}
                    className="ml-2 p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                    title="Share Progress"
                  >
                    <Share2 size={18} />
                  </button>
                )}
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-sm text-zinc-500 mb-1">
                {isCurrentDay ? "Today's Progress" : `Day ${viewingDay} Progress`}
              </div>
              <div className="text-2xl font-mono text-emerald-400 font-bold">{dailyProgressPercent}%</div>
            </div>
          </div>
          )}
          
          {/* Progress Bar (Hide on Settings and Zen) */}
          {currentView !== 'settings' && !zenMode && (
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-8">
               <div 
                 className="h-full bg-emerald-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                 style={{ width: `${dailyProgressPercent}%` }}
               />
            </div>
          )}
        </header>

        {/* Views */}
        {currentView === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isFutureDay ? (
              <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                 <CalendarIcon size={48} className="mx-auto text-zinc-600 mb-4" />
                 <h3 className="text-xl font-bold text-zinc-400">Future Locked</h3>
                 <p className="text-zinc-600">You cannot access this day yet. Focus on today.</p>
                 <button onClick={() => setViewingDay(progress.currentDay)} className="mt-4 text-emerald-500 hover:underline">
                    Go to Today
                 </button>
              </div>
            ) : (
              <>
                {/* Habits Grid */}
                <div className="grid grid-cols-1 gap-4">
                  {progress.customHabits.map((habit, index) => {
                    const isCompleted = viewingDayData.completedHabits.includes(habit.id);
                    return (
                      <HabitCard 
                        key={habit.id}
                        habit={habit}
                        completed={isCompleted}
                        onToggle={handleToggleHabit}
                        onOpenTimer={(h) => setActiveTimerHabit(h)}
                        disabled={!isCurrentDay}
                        streak={getHabitStreak(habit.id)}
                        shortcutKey={index + 1}
                      />
                    );
                  })}
                </div>

                {/* Finish Day Button */}
                {isCurrentDay && !zenMode && (
                  <button
                    onClick={handleFinishDay}
                    disabled={viewingDayData.completedHabits.length === 0 && !progress.history[progress.currentDay]?.frozen}
                    className={`
                      w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg
                      ${viewingDayData.completedHabits.length === progress.customHabits.length
                        ? 'bg-emerald-500 text-black hover:scale-[1.02] shadow-emerald-500/20 animate-pulse'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}
                      disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed
                    `}
                  >
                    {viewingDayData.completedHabits.length === progress.customHabits.length ? "Finish Day" : "Complete Day"}
                  </button>
                )}

                {/* Journal (Hidden in Zen Mode) */}
                {!zenMode && (
                  <div className="mt-8">
                    <DailyJournal 
                      note={viewingDayData.notes}
                      mood={viewingDayData.mood}
                      photo={viewingDayData.photo}
                      onNoteChange={handleUpdateNotes}
                      onMoodChange={handleUpdateMood}
                      onPhotoChange={handleUpdatePhoto}
                      disabled={!isCurrentDay}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {currentView === 'calendar' && (
          <CalendarView progress={progress} onDayClick={handleCalendarDayClick} />
        )}

        {currentView === 'stats' && (
          <StatsOverview progress={progress} onUpdateProgress={handleUpdateProgress} />
        )}

        {currentView === 'settings' && (
          <SettingsView 
            progress={progress} 
            onUpdate={handleUpdateProgress} 
            onReset={handleReset} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
