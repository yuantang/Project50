import React, { useState, useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UserProgress, Mood } from '../types';
import { TrophyRoom } from './TrophyRoom';
import { Gallery } from './Gallery';
import { Heatmap } from './Heatmap';
import { ChartBar, Search, Sparkles, TrendingUp, TrendingDown, ShoppingBag, Snowflake, Clock, Flame, RefreshCw, Zap, BookOpen } from 'lucide-react';
import { getPatternAnalysis } from '../services/geminiService';
import { SHOP_ITEMS, buyItem } from '../services/gamificationService';
import { saveProgress } from '../services/storageService';
import { soundService } from '../services/soundService';

interface StatsOverviewProps {
  progress: UserProgress;
  onUpdateProgress: (newProgress: UserProgress) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ progress, onUpdateProgress }) => {
  const [activeTab, setActiveTab] = useState<'charts' | 'gallery'>('charts');
  const [loadingPatterns, setLoadingPatterns] = useState(false);

  const { 
    chartData, 
    streak, 
    bestStreak, 
    totalFocusMinutes,
    focusData, 
    bestHabit, 
    worstHabit 
  } = useMemo(() => {
    const totalDays = progress.totalDays || 50;
    const habitCount = progress.customHabits.length;

    const moodValue = (mood?: Mood): number | null => {
      switch(mood) {
        case 'great': return 5;
        case 'good': return 4;
        case 'neutral': return 3;
        case 'bad': return 2;
        case 'terrible': return 1;
        default: return null;
      }
    };

    const data = Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dayData = progress.history[dayNum];
      const completed = dayData ? dayData.completedHabits.length : 0;
      const isFull = completed === habitCount;
      return {
        day: `D${dayNum}`,
        completed: completed,
        mood: dayData ? moodValue(dayData.mood) : null,
        isFuture: dayNum > progress.currentDay,
        full: isFull,
        frozen: dayData?.frozen
      };
    });

    const chartData = data.slice(0, Math.max(7, progress.currentDay));

    let currentStreak = 0;
    const todayData = progress.history[progress.currentDay];
    if (todayData && (todayData.completedHabits.length === habitCount || todayData.frozen)) {
      currentStreak++;
    }
    for (let i = progress.currentDay - 1; i >= 1; i--) {
      const dayData = progress.history[i];
      if (dayData && (dayData.completedHabits.length === habitCount || dayData.frozen)) {
        currentStreak++;
      } else {
        break;
      }
    }

    let bestStreak = 0;
    let tempStreak = 0;
    for (let i = 1; i <= progress.currentDay; i++) {
        const d = progress.history[i];
        if (d && (d.completedHabits.length === habitCount || d.frozen)) {
            tempStreak++;
        } else {
            tempStreak = 0;
        }
        if (tempStreak > bestStreak) bestStreak = tempStreak;
    }

    const habitStats = progress.customHabits.map(habit => {
      let completedCount = 0;
      for(let i=1; i<=progress.currentDay; i++) {
        if (progress.history[i]?.completedHabits.includes(habit.id)) {
          completedCount++;
        }
      }
      const rate = Math.round((completedCount / Math.max(1, progress.currentDay)) * 100);
      return { ...habit, rate };
    }).sort((a, b) => b.rate - a.rate);

    const bestHabit = habitStats[0];
    const worstHabit = habitStats[habitStats.length - 1];

    const focusData = progress.customHabits.map(habit => ({
      name: habit.label,
      minutes: progress.habitFocusDistribution?.[habit.id] || 0
    })).filter(d => d.minutes > 0).sort((a, b) => b.minutes - a.minutes);

    return {
        chartData,
        streak: currentStreak,
        bestStreak,
        totalFocusMinutes: progress.totalFocusMinutes || 0,
        habitStats,
        focusData,
        bestHabit,
        worstHabit
    };
  }, [progress]);

  const handleIdentifyPatterns = async () => {
    setLoadingPatterns(true);
    const result = await getPatternAnalysis(progress);
    
    const newProgress = { 
      ...progress, 
      cachedPattern: {
        text: result,
        date: new Date().toISOString()
      }
    };
    saveProgress(newProgress);
    onUpdateProgress(newProgress);
    
    setLoadingPatterns(false);
  };

  const handleBuyItem = (itemId: string) => {
    const newItemProgress = buyItem(progress, itemId);
    if (newItemProgress) {
      soundService.playSuccess();
      saveProgress(newItemProgress);
      onUpdateProgress(newItemProgress);
    } else {
      soundService.playError();
      alert("Not enough XP or item unavailable.");
    }
  };

  const formatFocusTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  // Dark theme styles for Recharts
  const chartTooltipStyle = { 
    backgroundColor: '#18181b', 
    borderColor: '#27272a', 
    color: '#e4e4e7', 
    fontSize: '11px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <TrophyRoom progress={progress} />

      <div className="flex p-1 bg-zinc-900 rounded-lg w-fit border border-zinc-800">
        <button
          onClick={() => setActiveTab('charts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all uppercase tracking-wide ${activeTab === 'charts' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <ChartBar size={14} />
          Stats & Grid
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all uppercase tracking-wide ${activeTab === 'gallery' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <BookOpen size={14} />
          Journal & Gallery
        </button>
      </div>

      {activeTab === 'charts' ? (
        <>
          <Heatmap progress={progress} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-surface border border-zinc-800 rounded-xl">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Current Day</p>
              <p className="text-2xl font-bold text-white mt-1">{progress.currentDay}<span className="text-zinc-600 text-sm">/{progress.totalDays}</span></p>
            </div>
            <div className="p-4 bg-surface border border-zinc-800 rounded-xl relative overflow-hidden group">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold z-10 relative">Current Streak</p>
              <div className="flex items-baseline gap-1 mt-1 z-10 relative">
                <p className="text-2xl font-bold text-orange-500">{streak}</p>
                <span className="text-zinc-600 text-xs">days</span>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity">
                <Flame size={48} className="text-orange-500" />
              </div>
            </div>
             <div className="p-4 bg-surface border border-zinc-800 rounded-xl">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Best Streak</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-2xl font-bold text-yellow-500">{bestStreak}</p>
                <span className="text-zinc-600 text-xs">days</span>
              </div>
            </div>
            <div className="p-4 bg-surface border border-zinc-800 rounded-xl">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Focus Time</p>
              <p className="text-2xl font-bold text-indigo-400 mt-1">
                {formatFocusTime(totalFocusMinutes)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
             <div className="lg:col-span-2 p-5 bg-indigo-950/10 border border-indigo-900/30 rounded-xl relative overflow-hidden group flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                   <Sparkles size={80} className="text-indigo-500" />
                </div>
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div>
                     <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                       <Search size={16} className="text-indigo-400" />
                       AI Pattern Hunter
                     </h3>
                     <p className="text-[10px] text-zinc-400 mt-1">Finding hidden correlations in your data.</p>
                  </div>
                  <div className="flex gap-2">
                    {progress.cachedPattern && (
                      <button 
                        onClick={handleIdentifyPatterns}
                        disabled={loadingPatterns}
                        className="p-1.5 bg-indigo-900/50 hover:bg-indigo-900 text-indigo-300 rounded-lg transition-colors border border-indigo-800"
                        title="Refresh Analysis"
                      >
                        <RefreshCw size={14} className={loadingPatterns ? 'animate-spin' : ''} />
                      </button>
                    )}
                    {!progress.cachedPattern && (
                      <button 
                        onClick={handleIdentifyPatterns}
                        disabled={loadingPatterns}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {loadingPatterns ? 'Scanning...' : 'Analyze Data'}
                      </button>
                    )}
                  </div>
                </div>
                {(progress.cachedPattern || loadingPatterns) && (
                   <div className="bg-black/20 p-3 rounded-lg border border-indigo-500/20 text-indigo-100 text-xs leading-relaxed animate-in fade-in relative">
                      {loadingPatterns ? (
                        <div className="flex items-center gap-2 text-indigo-300">
                          <Sparkles size={14} className="animate-pulse" />
                          <span>Gemini is analyzing...</span>
                        </div>
                      ) : (
                        <>
                          <div className="whitespace-pre-line">{progress.cachedPattern?.text}</div>
                          <p className="text-[9px] text-indigo-500/60 mt-1 text-right">
                            {new Date(progress.cachedPattern!.date).toLocaleDateString()}
                          </p>
                        </>
                      )}
                   </div>
                )}
             </div>

             <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden flex flex-col">
                 <div className="flex justify-between items-center mb-4 relative z-10">
                   <h2 className="text-sm font-bold text-white flex items-center gap-2">
                     <ShoppingBag size={16} className="text-purple-500" />
                     XP Shop
                   </h2>
                   <div className="bg-zinc-950 px-2 py-0.5 rounded text-[10px] font-mono text-purple-400 border border-purple-500/20">
                     {Math.floor(progress.xp)} XP
                   </div>
                 </div>
                 <div className="space-y-3 relative z-10 flex-1">
                   {SHOP_ITEMS.map(item => (
                     <div key={item.id} className="p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg flex items-center justify-between group hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-md bg-zinc-900 ${item.color}`}>
                            <Snowflake size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-200 text-xs">{item.label}</p>
                            <p className="text-[10px] text-zinc-500">{item.description}</p>
                            {item.id === 'streak_freeze' && (
                              <p className="text-[9px] text-cyan-500 mt-0.5 font-medium">
                                Owned: {progress.streakFreezes || 0}
                              </p>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleBuyItem(item.id)}
                          disabled={progress.xp < item.cost}
                          className="px-2 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600 rounded text-[10px] font-bold text-white transition-colors"
                        >
                          {item.cost}
                        </button>
                     </div>
                   ))}
                 </div>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-emerald-950/10 border border-emerald-900/30 p-3 rounded-xl flex items-center gap-3">
               <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-400"><TrendingUp size={16} /></div>
               <div><p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Strongest Habit</p><div className="flex items-baseline gap-2"><p className="text-white font-medium text-sm">{bestHabit?.label || "None"}</p><p className="text-[10px] text-emerald-500/70">{bestHabit?.rate || 0}%</p></div></div>
             </div>
             <div className="bg-red-950/10 border border-red-900/30 p-3 rounded-xl flex items-center gap-3">
               <div className="p-2 bg-red-500/10 rounded-full text-red-400"><TrendingDown size={16} /></div>
               <div><p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Needs Focus</p><div className="flex items-baseline gap-2"><p className="text-white font-medium text-sm">{worstHabit?.label || "None"}</p><p className="text-[10px] text-red-500/70">{worstHabit?.rate || 0}%</p></div></div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-56 bg-surface border border-zinc-800 rounded-xl p-4">
              <h3 className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-2 uppercase tracking-wide">
                <Clock size={14} className="text-indigo-400" /> Focus Breakdown
              </h3>
              {focusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={focusData} layout="vertical" margin={{ left: 10, right: 10 }}>
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={80} tick={{fill: '#a1a1aa', fontSize: 9}} interval={0} />
                     <Tooltip contentStyle={chartTooltipStyle} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                     <Bar dataKey="minutes" radius={[0, 4, 4, 0]} barSize={16}>
                        {focusData.map((_, index) => (<Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#818cf8' : '#6366f1'} />))}
                     </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2 pb-8"><Clock size={20} className="opacity-30" /><p className="text-[10px]">No focus data recorded.</p></div>
              )}
            </div>

            <div className="h-56 bg-surface border border-zinc-800 rounded-xl p-4">
              <h3 className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-2 uppercase tracking-wide">
                <Zap size={14} className="text-yellow-500" /> Mood Trend
              </h3>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={chartData}>
                  <XAxis dataKey="day" hide />
                  <YAxis domain={[1, 5]} hide />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [['Terrible', 'Bad', 'Neutral', 'Good', 'Great'][value-1] || 'N/A', 'Mood']} />
                  <Line type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 2 }} activeDot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="h-48 bg-surface border border-zinc-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <TrendingUp size={14} /> Habit Completion History
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" hide />
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: '#10b981' }} />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <Gallery progress={progress} />
      )}
    </div>
  );
};