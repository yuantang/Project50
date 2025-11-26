
export interface Habit {
  id: string;
  label: string;
  description: string;
  icon?: string; // Icon name from lucide-react
}

export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export interface DayData {
  date: string; // ISO date string
  completedHabits: string[]; // Array of habit IDs
  habitLogs?: Record<string, string>; // Key: habitId, Value: note (e.g., "Read 20 pages")
  notes: string;
  mood?: Mood;
  photo?: string; // Base64 encoded image string
  frozen?: boolean; // If true, this day counts towards streak even if incomplete
  freezeReason?: string; // Context for why the freeze was used
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  unlockedAt?: string; // ISO Date
  color: string; // Tailwind color class (e.g. text-yellow-500)
}

export interface UserProgress {
  userName?: string; // Identity
  avatar?: string; // Base64 string for user profile picture
  currentDay: number; // 1 to totalDays
  totalDays: number; // Configurable duration
  startDate: string | null;
  history: Record<number, DayData>; // Key is day number
  customHabits: Habit[]; // User defined habits
  isCompleted: boolean;
  failed: boolean;
  strictMode: boolean; // Enforce 100% completion or restart
  xp: number;
  level: number;
  badges: Badge[];
  manifesto?: string; // User's personal declaration
  totalFocusMinutes: number; // Track deep work time
  habitFocusDistribution?: Record<string, number>; // Track minutes per habit ID
  streakFreezes: number; // Inventory of freeze items
  aiPersona: 'sergeant' | 'stoic' | 'empathetic' | 'custom'; // AI personality
  customPersonaPrompt?: string; // User defined system instruction for AI
  cachedPattern?: { // Persist AI analysis
    text: string;
    date: string;
  };
  preferences?: {
    soundEnabled: boolean;
    hapticsEnabled: boolean;
    privacyBlurEnabled?: boolean; // Blur app when window loses focus
    notifications?: {
      enabled: boolean;
      time: string; // "09:00"
    };
  };
  // Sync Fields
  lastSyncedAt?: string; // ISO Date of last successful cloud sync
  updatedAt?: string; // ISO Date of last local modification
}

export interface AIResponse {
  message: string;
  type: 'motivation' | 'advice' | 'correction';
}

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'wake_up',
    label: 'Wake up before 8 AM',
    description: 'Start your day early with intention.',
    icon: 'Sun',
  },
  {
    id: 'morning_routine',
    label: 'Morning Routine',
    description: '1 hour with no distractions/phone.',
    icon: 'Coffee',
  },
  {
    id: 'exercise',
    label: 'Exercise for 1h',
    description: 'Push your physical limits daily.',
    icon: 'Dumbbell',
  },
  {
    id: 'reading',
    label: 'Read 10 Pages',
    description: 'Expand your knowledge constantly.',
    icon: 'BookOpen',
  },
  {
    id: 'skill',
    label: 'Learn a New Skill',
    description: 'Dedicate 1 hour to learning.',
    icon: 'Brain',
  },
  {
    id: 'diet',
    label: 'Healthy Diet',
    description: 'Fuel your body strictly. No alcohol/junk.',
    icon: 'Apple',
  },
  {
    id: 'track',
    label: 'Track Progress',
    description: 'Journal your thoughts and progress.',
    icon: 'PenTool',
  },
];
