
import { UserProgress, DEFAULT_HABITS } from '../types';

const STORAGE_KEY = 'project50_data_v12'; // Bumped version for habitLogs support
const APP_VERSION = '1.3.1';

const INITIAL_STATE: UserProgress = {
  userName: "",
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
    hapticsEnabled: true
  }
};

export const getAppVersion = () => APP_VERSION;

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
      parsed.preferences = { soundEnabled: true, hapticsEnabled: true };
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

export const saveProgress = (progress: UserProgress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save progress", e);
    // If quota exceeded, alert user (basic handling)
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      alert("Storage full! Please delete some photos in Settings.");
    }
  }
};

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
  // CSV Headers: Includes specific columns for each habit's note
  const headers = ['Date', 'Day', 'Completed Count', 'Mood', 'Notes', 'Frozen', ...progress.customHabits.map(h => h.label), ...progress.customHabits.map(h => `${h.label} Details`)];
  
  const rows = Object.entries(progress.history).map(([dayStr, data]) => {
    const habitStatuses = progress.customHabits.map(h => data.completedHabits.includes(h.id) ? 'YES' : 'NO');
    const habitNotes = progress.customHabits.map(h => data.habitLogs?.[h.id] ? `"${data.habitLogs[h.id].replace(/"/g, '""')}"` : '');
    
    return [
      data.date,
      dayStr,
      data.completedHabits.length,
      data.mood || '',
      `"${(data.notes || '').replace(/"/g, '""')}"`, // Escape quotes
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
        
        // Basic validation
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

// --- Storage Management Utilities ---

export const getStorageUsage = (): { usedKB: number; percent: number } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || '';
    const usedBytes = new Blob([stored]).size;
    const usedKB = Math.round(usedBytes / 1024);
    
    // LocalStorage limit is typically ~5MB (5120KB)
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

  if (cutoffDay < 1) return; // Nothing to clean

  let cleanedCount = 0;
  const newHistory = { ...progress.history };

  Object.keys(newHistory).forEach((dayStr) => {
    const day = parseInt(dayStr);
    if (day <= cutoffDay && newHistory[day].photo) {
      newHistory[day] = { ...newHistory[day], photo: undefined }; // Remove photo
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