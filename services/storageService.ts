
import { UserProgress, DEFAULT_HABITS } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'project50_data_v12'; 
const APP_VERSION = '1.5.0'; // Final Cyber-Stoic Release

const INITIAL_STATE: UserProgress = {
  userName: "",
  avatar: undefined,
  currentDay: 1,
  totalDays: 50,
  startDate: null,
  history: {},
  customHabits: DEFAULT_HABITS,
  isCompleted: false,
  failed: false,
  strictMode: false,
  xp: 0,
  level: 1,
  badges: [],
  manifesto: "",
  totalFocusMinutes: 0,
  habitFocusDistribution: {},
  streakFreezes: 0,
  aiPersona: 'stoic',
  cachedPattern: undefined,
  preferences: {
    soundEnabled: true,
    hapticsEnabled: true,
    privacyBlurEnabled: false
  },
  updatedAt: new Date().toISOString()
};

export const getAppVersion = () => APP_VERSION;

// --- Local Storage Operations ---

export const getProgress = (): UserProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_STATE;
    
    const parsed = JSON.parse(stored);
    
    // Migration helper
    if (!parsed.customHabits) parsed.customHabits = DEFAULT_HABITS;
    if (!parsed.totalDays) parsed.totalDays = 50;
    if (parsed.strictMode === undefined) parsed.strictMode = false;
    if (parsed.xp === undefined) parsed.xp = 0;
    if (parsed.level === undefined) parsed.level = 1;
    if (!parsed.badges) parsed.badges = [];
    if (parsed.manifesto === undefined) parsed.manifesto = "";
    if (parsed.userName === undefined) parsed.userName = "";
    if (parsed.totalFocusMinutes === undefined) parsed.totalFocusMinutes = 0;
    if (parsed.habitFocusDistribution === undefined) parsed.habitFocusDistribution = {};
    if (parsed.streakFreezes === undefined) parsed.streakFreezes = 0;
    if (parsed.aiPersona === undefined) parsed.aiPersona = 'stoic';
    if (parsed.preferences === undefined) {
      parsed.preferences = { soundEnabled: true, hapticsEnabled: true, privacyBlurEnabled: false };
    }
    
    // Migrate History to include habitLogs if missing
    if (parsed.history) {
      Object.keys(parsed.history).forEach(key => {
        const k = Number(key);
        if (!parsed.history[k].habitLogs) {
          parsed.history[k].habitLogs = {};
        }
      });
    }

    return parsed;
  } catch (e) {
    console.error("Failed to load progress", e);
    return INITIAL_STATE;
  }
};

export const saveProgress = async (progress: UserProgress, skipCloud: boolean = false) => {
  const updatedProgress = { ...progress, updatedAt: new Date().toISOString() };
  
  // 1. Save Local (Offline First)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgress));
  } catch (e) {
    console.error("Failed to save progress locally", e);
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      alert("Storage full! Please delete some photos in Settings.");
    }
  }

  // 2. Sync to Cloud (if configured and online)
  if (!skipCloud && isSupabaseConfigured() && navigator.onLine) {
    syncToCloud(updatedProgress);
  }
};

// --- Cloud Sync Operations ---

const syncToCloud = async (progress: UserProgress) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Not logged in

    const { error } = await supabase
      .from('user_progress')
      .upsert({ 
        user_id: user.id, 
        data: progress,
        updated_at: new Date().toISOString() 
      }, { onConflict: 'user_id' });

    if (error) throw error;
    
    // Update last synced time locally
    const syncedProgress = { ...progress, lastSyncedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedProgress));
    
  } catch (e) {
    console.error("Cloud sync failed:", e);
  }
};

export const syncFromCloud = async (): Promise<UserProgress | null> => {
  if (!isSupabaseConfigured() || !navigator.onLine) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_progress')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;

    const cloudProgress = data.data as UserProgress;
    const localProgress = getProgress();

    // Conflict Resolution: Last Write Wins based on updatedAt
    const cloudTime = new Date(data.updated_at).getTime();
    const localTime = new Date(localProgress.updatedAt || 0).getTime();

    if (cloudTime > localTime) {
      console.log("Cloud data is newer. Syncing down.");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudProgress));
      return cloudProgress;
    } else if (localTime > cloudTime) {
      console.log("Local data is newer. Syncing up.");
      await syncToCloud(localProgress);
      return null; // Local is already up to date
    }
    
    return null;
  } catch (e) {
    console.error("Sync from cloud failed", e);
    return null;
  }
};

// --- Export/Import Utilities ---

export const startChallenge = (totalDays: number = 50, habits = DEFAULT_HABITS): UserProgress => {
  const newState: UserProgress = {
    ...INITIAL_STATE,
    totalDays: totalDays,
    customHabits: habits,
    startDate: new Date().toISOString(),
  };
  saveProgress(newState);
  return newState;
};

export const resetChallenge = (): UserProgress => {
  localStorage.removeItem(STORAGE_KEY);
  return INITIAL_STATE;
};

export const exportData = (): void => {
  const data = getProgress();
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `project50_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportCSV = (): void => {
  const progress = getProgress();
  const headers = ['Date', 'Day', 'Completed Count', 'Mood', 'Notes', 'Frozen', ...progress.customHabits.map(h => h.label), ...progress.customHabits.map(h => `${h.label} Details`)];
  
  const rows = Object.entries(progress.history).map(([dayStr, data]) => {
    const habitStatuses = progress.customHabits.map(h => data.completedHabits.includes(h.id) ? 'YES' : 'NO');
    const habitNotes = progress.customHabits.map(h => data.habitLogs?.[h.id] ? `"${data.habitLogs[h.id].replace(/"/g, '""')}"` : '');
    
    return [
      data.date,
      dayStr,
      data.completedHabits.length,
      data.mood || '',
      `"${(data.notes || '').replace(/"/g, '""')}"`,
      data.frozen ? 'YES' : 'NO',
      ...habitStatuses,
      ...habitNotes
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `project50_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importData = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const parsed = JSON.parse(result);
        
        if (parsed.history && parsed.customHabits && typeof parsed.currentDay === 'number') {
          saveProgress(parsed);
          resolve(true);
        } else {
          alert("Invalid file format.");
          resolve(false);
        }
      } catch (error) {
        alert("Failed to parse JSON.");
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
};

export const getStorageUsage = (): { usedKB: number; percent: number } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || '';
    const usedBytes = new Blob([stored]).size;
    const usedKB = Math.round(usedBytes / 1024);
    const limitKB = 5120; 
    const percent = Math.min(100, Math.round((usedKB / limitKB) * 100));
    return { usedKB, percent };
  } catch (e) {
    return { usedKB: 0, percent: 0 };
  }
};

export const clearOldPhotos = (keepRecentDays: number = 30): void => {
  const progress = getProgress();
  const currentDay = progress.currentDay;
  const cutoffDay = currentDay - keepRecentDays;

  if (cutoffDay < 1) return;

  let cleanedCount = 0;
  const newHistory = { ...progress.history };

  Object.keys(newHistory).forEach((dayStr) => {
    const day = parseInt(dayStr);
    if (day <= cutoffDay && newHistory[day].photo) {
      newHistory[day] = { ...newHistory[day], photo: undefined };
      cleanedCount++;
    }
  });

  if (cleanedCount > 0) {
    const newProgress = { ...progress, history: newHistory };
    saveProgress(newProgress);
    alert(`Cleaned photos from ${cleanedCount} past days.`);
  } else {
    alert("No old photos found to clean.");
  }
};
