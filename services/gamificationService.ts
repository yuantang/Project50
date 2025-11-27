
import { UserProgress, Badge } from '../types';

export const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'first_step',
    label: 'First Step',
    description: 'Completed Day 1.',
    icon: 'Footprints',
    color: 'text-emerald-400'
  },
  {
    id: 'week_warrior',
    label: 'Week Warrior',
    description: 'Completed the first 7 days.',
    icon: 'Sword',
    color: 'text-blue-400'
  },
  {
    id: 'halfway_hero',
    label: 'Halfway Hero',
    description: 'Reached the 50% mark of the challenge.',
    icon: 'Mountain',
    color: 'text-yellow-400'
  },
  {
    id: 'strict_master',
    label: 'Iron Will',
    description: 'Completed 10 days in Strict Mode.',
    icon: 'ShieldAlert', // Changed from Shield to valid Lucide icon
    color: 'text-red-500'
  },
  {
    id: 'project_elite',
    label: 'Project Elite',
    description: 'Completed the full challenge.',
    icon: 'Crown',
    color: 'text-purple-400'
  }
];

export const SHOP_ITEMS = [
  {
    id: 'streak_freeze',
    label: 'Streak Freeze',
    description: 'Protect your streak for one day if you miss habits.',
    cost: 500,
    icon: 'Snowflake',
    color: 'text-cyan-400'
  }
];

export const buyItem = (progress: UserProgress, itemId: string): UserProgress | null => {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return null;

  if (progress.xp < item.cost) return null;

  let newProgress = { ...progress };
  newProgress.xp -= item.cost;

  if (itemId === 'streak_freeze') {
    newProgress.streakFreezes = (newProgress.streakFreezes || 0) + 1;
  }

  return newProgress;
};

export const calculateLevel = (xp: number): number => {
  // Simple formula: Level = sqrt(XP / 100)
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const checkBadges = (progress: UserProgress): Badge[] => {
  const newBadges: Badge[] = [];
  const currentBadges = progress.badges || [];
  const hasBadge = (id: string) => currentBadges.some(b => b.id === id);
  const totalHabits = progress.customHabits.length;

  const isDayComplete = (day: number) => {
    const data = progress.history[day];
    if (!data) return false;
    return data.frozen || data.completedHabits.length === totalHabits;
  };

  // Check First Step (Check if Day 1 data exists and is complete, regardless of currentDay pointer)
  if (isDayComplete(1) && !hasBadge('first_step')) {
    newBadges.push({ ...AVAILABLE_BADGES.find(b => b.id === 'first_step')!, unlockedAt: new Date().toISOString() });
  }

  // Check Week Warrior (Check days 1-7)
  let firstWeekComplete = true;
  for (let i = 1; i <= 7; i++) {
    if (!isDayComplete(i)) {
      firstWeekComplete = false;
      break;
    }
  }
  if (firstWeekComplete && !hasBadge('week_warrior')) {
    newBadges.push({ ...AVAILABLE_BADGES.find(b => b.id === 'week_warrior')!, unlockedAt: new Date().toISOString() });
  }

  // Check Halfway
  const halfwayPoint = Math.floor(progress.totalDays / 2);
  let halfwayComplete = true;
  for (let i = 1; i <= halfwayPoint; i++) {
      if (!isDayComplete(i)) { 
          // Relaxed check: just check if they reached the day number? 
          // Usually badges imply *completing* the days.
          // For now, let's keep it based on reaching the day to be generous, or check completion count.
          // Let's stick to the previous logic: if currentDay > halfway
      }
  }
  // Reverting Halfway to "Reached Day X" logic, but ensuring previous days aren't empty helps.
  if (progress.currentDay > halfwayPoint && !hasBadge('halfway_hero')) {
    newBadges.push({ ...AVAILABLE_BADGES.find(b => b.id === 'halfway_hero')!, unlockedAt: new Date().toISOString() });
  }

  // Check Strict Mode (10 days complete while strict)
  if (progress.strictMode) {
      let strictStreak = 0;
      for(let i = 1; i <= progress.currentDay; i++) {
          if (isDayComplete(i)) strictStreak++;
      }
      if (strictStreak >= 10 && !hasBadge('strict_master')) {
          newBadges.push({ ...AVAILABLE_BADGES.find(b => b.id === 'strict_master')!, unlockedAt: new Date().toISOString() });
      }
  }

  return newBadges;
};

export const calculateDailyXP = (completedHabitsCount: number, totalHabits: number): number => {
  const baseXP = 50;
  const habitBonus = 10 * completedHabitsCount;
  const perfectBonus = completedHabitsCount === totalHabits ? 50 : 0;
  return baseXP + habitBonus + perfectBonus;
};
