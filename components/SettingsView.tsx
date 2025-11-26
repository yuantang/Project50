import React, { useState, useEffect } from 'react';
import { 
  User, Target, HardDrive, TriangleAlert, ChevronLeft, ChevronRight, 
  Bot, ArrowUp, ArrowDown, Trash, Plus, Download, Upload, FileSpreadsheet, 
  Eraser, Info, Shield, CircleHelp, Volume2, VolumeX, Vibrate, VibrateOff, 
  Share2, Save, Bell, BellOff, Clock, LayoutTemplate, Palette, Check, Lock, Eye,
  CircleAlert
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { UserProgress, Habit, DEFAULT_HABITS } from '../types';
import { 
  resetChallenge, exportData, 
  exportCSV, importData, getStorageUsage, clearOldPhotos, getAppVersion 
} from '../services/storageService';
import { soundService } from '../services/soundService';

type SettingsState = 'menu' | 'account' | 'challenge' | 'data' | 'preferences' | 'info' | 'danger';

// Robust Icon Component to prevent crashes
const SafeIcon = ({ name, size = 16, className = "" }: { name: string, size?: number, className?: string }) => {
  const IconComp = (Icons as any)[name] || Icons.Circle;
  return <IconComp size={size} className={className} />;
};

// Available icons for custom habits
const ICON_OPTIONS = [
  'Activity', 'AlarmClock', 'Apple', 'Bike', 'Book', 'BookOpen', 
  'Brain', 'Camera', 'CircleCheck', 'Coffee', 'Code', 'Dumbbell', 
  'Droplet', 'Flame', 'Flower2', 'Gamepad2', 'Heart', 'Moon', 
  'Music', 'Palette', 'PenTool', 'Footprints', 'Sun', 'Target', 'Zap',
  'Briefcase', 'DollarSign', 'Utensils', 'GlassWater', 'BedDouble'
];

const TEMPLATES = [
  {
    name: 'Project 50 (Standard)',
    description: 'The classic 50-day discipline challenge.',
    days: 50,
    habits: DEFAULT_HABITS
  },
  {
    name: '75 Hard Style',
    description: 'Mental toughness. Two workouts, strict diet.',
    days: 75,
    habits: [
      { id: 'diet', label: 'Strict Diet (No Cheat)', description: 'Stick to a plan.', icon: 'Apple' },
      { id: 'water', label: '1 Gallon Water', description: 'Hydrate.', icon: 'Droplet' },
      { id: 'workout1', label: '45m Workout (Indoor)', description: 'Gym or weights.', icon: 'Dumbbell' },
      { id: 'workout2', label: '45m Workout (Outdoor)', description: 'Must be outside.', icon: 'Sun' },
      { id: 'read', label: 'Read 10 Pages', description: 'Non-fiction.', icon: 'BookOpen' },
      { id: 'photo', label: 'Progress Photo', description: 'Take a daily picture.', icon: 'Camera' },
    ]
  },
  {
    name: 'Dopamine Detox',
    description: 'Reset your brain. Low stimulation.',
    days: 30,
    habits: [
      { id: 'social', label: 'No Social Media', description: 'Zero scrolling.', icon: 'CircleX' },
      { id: 'meditate', label: 'Meditate 20m', description: 'Mindfulness.', icon: 'Brain' },
      { id: 'journal', label: 'Journaling', description: 'Write thoughts.', icon: 'PenTool' },
      { id: 'nature', label: 'Nature Walk', description: '30 mins outside.', icon: 'Footprints' },
      { id: 'read', label: 'Read 1 hr', description: 'Deep reading.', icon: 'Book' },
    ]
  },
  {
    name: 'Monk Mode',
    description: 'Extreme productivity and focus.',
    days: 21,
    habits: [
      { id: 'monk_morning', label: 'Monk Morning', description: 'No phone for 1h.', icon: 'Sun' },
      { id: 'meditate', label: 'Meditate 30m', description: 'Silence.', icon: 'Brain' },
      { id: 'deep_work', label: 'Deep Work 4h', description: 'Zero distractions.', icon: 'Briefcase' },
      { id: 'exercise', label: 'Exercise 1h', description: 'Move body.', icon: 'Dumbbell' },
      { id: 'diet', label: 'Clean Diet', description: 'Whole foods only.', icon: 'Apple' },
    ]
  }
];

const SaveButton = ({ onClick, hasChanges }: { onClick: () => void; hasChanges: boolean }) => (
  <div className="flex justify-end pt-6 border-t border-zinc-800 mt-8">
    <button
      onClick={onClick}
      disabled={!hasChanges}
      className={`
        px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-xl
        ${hasChanges 
          ? 'bg-emerald-500 text-black hover:bg-emerald-400 hover:scale-[1.02] shadow-emerald-500/20' 
          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'}
      `}
    >
      <Save size={18} />
      {hasChanges ? 'Save Changes' : 'Saved'}
    </button>
  </div>
);

interface SettingsViewProps {
  progress: UserProgress;
  onUpdate: (newProgress: UserProgress) => void;
  onReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ progress, onUpdate, onReset }) => {
  const [view, setView] = useState<SettingsState>('menu');
  
  // Local Edit State
  const [editName, setEditName] = useState(progress.userName || "");
  const [editPersona, setEditPersona] = useState(progress.aiPersona || 'stoic');
  const [editCustomPrompt, setEditCustomPrompt] = useState(progress.customPersonaPrompt || "");
  const [editHabits, setEditHabits] = useState<Habit[]>(progress.customHabits);
  const [editDays, setEditDays] = useState(progress.totalDays);
  const [editStrictMode, setEditStrictMode] = useState(progress.strictMode);
  
  // Preferences
  const [preferences, setPreferences] = useState(progress.preferences || { 
    soundEnabled: true, 
    hapticsEnabled: true,
    notifications: { enabled: false, time: "09:00" },
    privacyBlurEnabled: false
  });
  
  const [newHabitLabel, setNewHabitLabel] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("Target");
  const [storageStats, setStorageStats] = useState(getStorageUsage());
  const [manualDayInput, setManualDayInput] = useState(progress.currentDay);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  
  // Permission State
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  
  // Copy State
  const [isCopied, setIsCopied] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    const isDirty = 
      JSON.stringify(editHabits) !== JSON.stringify(progress.customHabits) ||
      editDays !== progress.totalDays ||
      editStrictMode !== progress.strictMode ||
      editName !== (progress.userName || "") ||
      editPersona !== progress.aiPersona ||
      editCustomPrompt !== (progress.customPersonaPrompt || "") ||
      JSON.stringify(preferences) !== JSON.stringify(progress.preferences);
    
    setHasUnsavedChanges(isDirty);
  }, [editHabits, editDays, editStrictMode, editName, editPersona, editCustomPrompt, preferences, progress]);

  // Refresh storage stats when entering data view
  useEffect(() => {
    if (view === 'data') setStorageStats(getStorageUsage());
  }, [view]);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleSave = () => {
    if (editHabits.length === 0) {
      alert("You need at least one habit.");
      return;
    }
    const newProgress = {
      ...progress,
      userName: editName,
      totalDays: editDays,
      customHabits: editHabits,
      strictMode: editStrictMode,
      aiPersona: editPersona,
      customPersonaPrompt: editCustomPrompt,
      preferences: preferences
    };
    onUpdate(newProgress);
    setHasUnsavedChanges(false);
    soundService.playSuccess();
  };

  const handleAddHabit = () => {
    if (!newHabitLabel.trim()) return;
    const newHabit: Habit = {
      id: Date.now().toString(),
      label: newHabitLabel,
      description: 'Custom goal',
      icon: newHabitIcon
    };
    setEditHabits([...editHabits, newHabit]);
    setNewHabitLabel("");
    setNewHabitIcon("Target");
    setIsAddingHabit(false);
  };

  const handleUpdateHabit = (id: string, key: keyof Habit, value: string) => {
    setEditHabits(prev => prev.map(h => h.id === id ? { ...h, [key]: value } : h));
  };

  const handleRemoveHabit = (id: string) => {
    // Enhanced warning for habit deletion
    if (confirm("⚠️ WARNING: Deleting this habit will remove it from all past history logs visually. This action cannot be undone.\n\nAre you sure you want to delete?")) {
      setEditHabits(editHabits.filter(h => h.id !== id));
    }
  };

  const handleMoveHabit = (index: number, direction: -1 | 1) => {
    const newHabits = [...editHabits];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newHabits.length) {
      [newHabits[index], newHabits[targetIndex]] = [newHabits[targetIndex], newHabits[index]];
      setEditHabits(newHabits);
    }
  };

  const handleApplyTemplate = (template: typeof TEMPLATES[0]) => {
    // Remove confirm dialog for smoother UX - user still has to click Save
    const newHabits = template.habits.map(h => ({ ...h }));
    setEditHabits(newHabits);
    setEditDays(template.days);
    soundService.playClick();
  };

  const handleTogglePreference = (key: keyof typeof preferences) => {
    if (key === 'notifications') return; // Handled separately
    const newVal = !preferences[key as keyof typeof preferences];
    const newPrefs = { ...preferences, [key]: newVal };
    setPreferences(newPrefs);
    soundService.updateSettings(newPrefs.soundEnabled, newPrefs.hapticsEnabled);
    
    // Immediate Feedback
    if (key === 'soundEnabled' && newVal === true) {
       soundService.playComplete(); // Verify sound
    }
    if (key === 'hapticsEnabled' && newVal === true) {
       soundService.vibrate([30, 30, 30]); // Verify vibration
    }
  };

  const handleNotificationToggle = async () => {
    if (!('Notification' in window)) {
      alert("Your browser does not support notifications.");
      return;
    }

    const current = preferences.notifications || { enabled: false, time: "09:00" };
    
    // Logic: 
    // If enabling: Check permission. If default, request. If denied, show error.
    // If disabling: Just disable.

    if (!current.enabled) {
      if (permissionStatus === 'denied') {
        soundService.playError();
        return; // Don't allow toggling on if denied
      }

      if (permissionStatus === 'default') {
        const result = await Notification.requestPermission();
        setPermissionStatus(result);
        if (result === 'granted') {
          // Proceed to enable
          setPreferences({
            ...preferences,
            notifications: { ...current, enabled: true }
          });
          soundService.playClick();
        }
        return;
      }
    }

    // Normal toggle (Granted or Disabling)
    setPreferences({
      ...preferences,
      notifications: { ...current, enabled: !current.enabled }
    });
    soundService.playClick();
  };

  const handleNotificationTime = (time: string) => {
    const current = preferences.notifications || { enabled: false, time: "09:00" };
    setPreferences({
      ...preferences,
      notifications: { ...current, time }
    });
  };

  const handleReset = () => {
    if (confirm("DANGER: Are you sure? This will delete ALL progress and reset the app to Day 1.")) {
      onReset();
    }
  };

  const handleRewindDay = () => {
    if (progress.currentDay <= 1) return;
    if (confirm("Rewinding the day will move your progress cursor back. Existing data might be overwritten. Continue?")) {
      onUpdate({ ...progress, currentDay: progress.currentDay - 1 });
      alert(`Rewound to Day ${progress.currentDay - 1}.`);
    }
  };

  const handleManualDaySet = () => {
    if (manualDayInput < 1 || manualDayInput > progress.totalDays) return;
    if (confirm(`Force set Current Day to ${manualDayInput}?`)) {
      onUpdate({ ...progress, currentDay: manualDayInput });
      alert(`Day set to ${manualDayInput}.`);
    }
  };

  const handleShareConfig = async () => {
    try {
      const config = { days: editDays, habits: editHabits, mode: editStrictMode ? 'strict' : 'normal' };
      const encoded = btoa(JSON.stringify(config));
      const url = `${window.location.origin}?config=${encoded}`;
      
      await navigator.clipboard.writeText(url);
      
      setIsCopied(true);
      soundService.playSuccess();
      setTimeout(() => setIsCopied(false), 2500);
      
    } catch (e) {
      // Fallback for security contexts where writeText is blocked
      const config = { days: editDays, habits: editHabits, mode: editStrictMode ? 'strict' : 'normal' };
      const encoded = btoa(JSON.stringify(config));
      const url = `${window.location.origin}?config=${encoded}`;
      prompt("Copy this link to share your protocol:", url);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await importData(file);
      if (success) {
        window.location.reload();
      }
    }
  };

  // --- Render ---

  if (view === 'menu') {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <h2 className="text-3xl font-black text-white mb-8 tracking-tight">Settings</h2>
        
        <div className="grid gap-3">
          {[
            { id: 'account', icon: User, label: 'Profile & Persona', sub: 'Name, AI Personality', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
            { id: 'challenge', icon: Target, label: 'Habits & Protocol', sub: 'Templates, Duration, Goals', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { id: 'preferences', icon: Volume2, label: 'App Preferences', sub: 'Sound, Haptics, Privacy', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            { id: 'data', icon: HardDrive, label: 'Data Management', sub: 'Backup, Restore, Storage', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
            { id: 'info', icon: Info, label: 'About', sub: 'Version, Privacy', color: 'text-zinc-400', bg: 'bg-zinc-900', border: 'border-zinc-800' },
            { id: 'danger', icon: TriangleAlert, label: 'Danger Zone', sub: 'Reset, Rewind', color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/10' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setView(item.id as SettingsState)}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99] group ${item.bg} ${item.border}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-black/20 ${item.color}`}>
                  <item.icon size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white text-lg leading-tight">{item.label}</p>
                  <p className="text-xs text-zinc-500 font-medium mt-1">{item.sub}</p>
                </div>
              </div>
              <ChevronRight className="text-zinc-600 group-hover:text-white transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300 min-h-[60vh]">
      <button 
        onClick={() => setView('menu')}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors group px-2"
      >
        <div className="p-1 rounded-full group-hover:bg-zinc-800 transition-colors">
          <ChevronLeft size={20} />
        </div>
        <span className="font-medium">Back to Settings</span>
      </button>

      {/* --- Account View --- */}
      {view === 'account' && (
        <div className="bg-surface border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-8">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
               <User size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white">Identity</h2>
               <p className="text-zinc-500 text-sm">Who is taking the challenge?</p>
             </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Display Name</label>
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-black/30 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                placeholder="Your Name"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">AI Coach Persona</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {(['sergeant', 'stoic', 'empathetic', 'custom'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setEditPersona(p)}
                    className={`
                      relative p-4 rounded-xl border text-left transition-all overflow-hidden group
                      ${editPersona === p 
                        ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}
                    `}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot size={18} className={editPersona === p ? 'text-indigo-400' : 'text-zinc-600'} />
                        <span className="font-bold capitalize">{p}</span>
                      </div>
                      <p className="text-[10px] leading-relaxed opacity-70">
                        {p === 'sergeant' && "Ruthless. Drill Sergeant. No excuses allowed."}
                        {p === 'stoic' && "Calm. Rational. Focus on duty and virtue."}
                        {p === 'empathetic' && "Kind. Supportive. Focus on mental health."}
                        {p === 'custom' && "Define your own coaching personality."}
                      </p>
                    </div>
                    {editPersona === p && <div className="absolute inset-0 border-2 border-indigo-500 rounded-xl opacity-20" />}
                  </button>
                ))}
              </div>

              {/* Custom Prompt Editor */}
              {editPersona === 'custom' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                   <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">System Instruction Prompt</label>
                   <textarea
                     value={editCustomPrompt}
                     onChange={(e) => setEditCustomPrompt(e.target.value)}
                     placeholder="e.g. You are Yoda. Speak in riddles but give great advice."
                     className="w-full bg-indigo-950/20 border border-indigo-500/30 rounded-xl px-4 py-3 text-indigo-100 focus:border-indigo-500 focus:outline-none transition-colors min-h-[100px] text-sm"
                   />
                </div>
              )}
            </div>
          </div>
          <SaveButton onClick={handleSave} hasChanges={hasUnsavedChanges} />
        </div>
      )}

      {/* --- Challenge View --- */}
      {view === 'challenge' && (
        <div className="space-y-6">
           <div className="bg-surface border border-zinc-800 rounded-2xl p-6 md:p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <Target size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Protocol</h2>
                    <p className="text-zinc-500 text-sm">Define your rules.</p>
                  </div>
                </div>
                <button 
                  onClick={handleShareConfig}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isCopied ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-emerald-400'}`}
                >
                  {isCopied ? <Check size={16} /> : <Share2 size={16} />}
                  {isCopied ? "Link Copied!" : "Share Protocol"}
                </button>
              </div>

              {/* Templates */}
              <div className="mb-8">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Quick Templates</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TEMPLATES.map(t => {
                      // Check if this template is currently "active" in local edits
                      const isActive = editDays === t.days && editHabits.length === t.habits.length && 
                                      editHabits[0]?.label === t.habits[0]?.label;
                      
                      return (
                      <button
                        key={t.name}
                        onClick={() => handleApplyTemplate(t)}
                        className={`
                          p-4 rounded-xl border text-left transition-all group relative overflow-hidden
                          ${isActive 
                            ? 'bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500/50' 
                            : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'}
                        `}
                      >
                        <div className="flex justify-between items-center mb-1 relative z-10">
                          <span className={`font-bold text-sm transition-colors ${isActive ? 'text-emerald-400' : 'text-zinc-200 group-hover:text-white'}`}>
                            {t.name}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-black/40 text-zinc-500'}`}>
                            {t.days}d
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-tight relative z-10">{t.description}</p>
                        {isActive && <div className="absolute inset-0 bg-emerald-500/5 z-0" />}
                      </button>
                    )})}
                  </div>
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Duration (Days)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={editDays}
                        onChange={(e) => setEditDays(Number(e.target.value))}
                        className="w-full bg-black/30 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono focus:border-emerald-500 focus:outline-none transition-colors"
                        min="1" max="365"
                      />
                      <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Mode</label>
                    <div 
                      onClick={() => setEditStrictMode(!editStrictMode)}
                      className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${editStrictMode ? 'bg-orange-950/20 border-orange-500/50' : 'bg-black/30 border-zinc-800'}`}
                    >
                      <div className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${editStrictMode ? 'bg-orange-500' : 'bg-zinc-700'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${editStrictMode ? 'left-5' : 'left-1'}`} />
                      </div>
                      <div>
                        <span className={`font-bold text-sm ${editStrictMode ? 'text-orange-400' : 'text-zinc-300'}`}>Strict Mode</span>
                        <span className="text-[10px] text-zinc-500 block">Fail = Reset to Day 1</span>
                      </div>
                    </div>
                  </div>
              </div>

              {/* Habits List */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Active Habits</label>
                   <button 
                     onClick={() => setIsAddingHabit(true)} 
                     className="text-emerald-400 text-xs font-bold hover:text-emerald-300 flex items-center gap-1"
                   >
                     <Plus size={14} /> Add Custom
                   </button>
                </div>
                
                {isAddingHabit && (
                  <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-xl animate-in zoom-in-95">
                    <div className="flex gap-3 mb-3">
                      <div className="p-3 bg-black/40 rounded-xl border border-zinc-700 flex items-center justify-center shrink-0">
                         <SafeIcon name={newHabitIcon} size={20} className="text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <input 
                          autoFocus
                          type="text" 
                          value={newHabitLabel}
                          onChange={(e) => setNewHabitLabel(e.target.value)}
                          placeholder="Habit Name (e.g. Meditate)"
                          className="w-full bg-transparent border-b border-zinc-700 pb-2 text-white focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600 mb-2"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                        />
                        <p className="text-[10px] text-zinc-500">Press Enter to add</p>
                      </div>
                    </div>
                    {/* Icon Picker */}
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                      {ICON_OPTIONS.map(icon => (
                        <button
                          key={icon}
                          onClick={() => setNewHabitIcon(icon)}
                          className={`p-2 rounded-lg transition-all ${newHabitIcon === icon ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500' : 'bg-black/40 text-zinc-500 hover:bg-zinc-800'}`}
                        >
                          <SafeIcon name={icon} size={16} />
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button onClick={() => setIsAddingHabit(false)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white">Cancel</button>
                      <button onClick={handleAddHabit} className="px-3 py-1.5 bg-emerald-500 text-black rounded-lg text-xs font-bold">Add Habit</button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {editHabits.map((habit, index) => (
                    <div key={habit.id} className="group flex items-center gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-all hover:bg-zinc-900">
                      <div className="flex flex-col gap-1 text-zinc-600">
                          <button onClick={() => handleMoveHabit(index, -1)} disabled={index === 0} className="hover:text-white disabled:opacity-20"><ArrowUp size={12} /></button>
                          <button onClick={() => handleMoveHabit(index, 1)} disabled={index === editHabits.length - 1} className="hover:text-white disabled:opacity-20"><ArrowDown size={12} /></button>
                      </div>
                      
                      <div className="p-2.5 bg-black/40 rounded-lg text-zinc-400 border border-zinc-800">
                        <SafeIcon name={habit.icon || 'Circle'} size={18} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={habit.label}
                            onChange={(e) => handleUpdateHabit(habit.id, 'label', e.target.value)}
                            className="bg-transparent text-sm font-bold text-zinc-200 focus:text-white focus:outline-none w-full mb-0.5"
                          />
                          <input
                            type="text"
                            value={habit.description}
                            onChange={(e) => handleUpdateHabit(habit.id, 'description', e.target.value)}
                            className="bg-transparent text-[10px] text-zinc-500 focus:text-zinc-400 focus:outline-none w-full"
                          />
                      </div>
                      
                      <button 
                        onClick={() => handleRemoveHabit(habit.id)} 
                        className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <SaveButton onClick={handleSave} hasChanges={hasUnsavedChanges} />
           </div>
        </div>
      )}

      {/* --- Data View --- */}
      {view === 'data' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Storage Card */}
          <div className="p-6 bg-surface border border-zinc-800 rounded-2xl flex flex-col justify-between">
            <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                  <HardDrive size={20} className="text-blue-500" />
                  Local Storage
                </h2>
                
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-medium text-zinc-400 mb-2">
                    <span>Used Space</span>
                    <span className={storageStats.percent > 80 ? 'text-red-500' : 'text-emerald-500'}>{storageStats.percent}%</span>
                  </div>
                  <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className={`h-full transition-all duration-700 ${storageStats.percent > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${storageStats.percent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2 text-right">{storageStats.usedKB}KB / ~5000KB</p>
                </div>
            </div>
            
            <button 
              onClick={() => {
                  if (confirm("Delete photos older than 30 days to free up space?")) {
                      clearOldPhotos(30);
                      setStorageStats(getStorageUsage());
                  }
              }}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-300 transition-colors flex items-center justify-center gap-2"
            >
              <Eraser size={14} />
              Cleanup Old Photos
            </button>
          </div>

          {/* Backup Card */}
          <div className="p-6 bg-surface border border-zinc-800 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                <Download size={20} className="text-emerald-500" />
                Backup & Restore
              </h2>
              
              <div className="space-y-3">
                <button onClick={exportData} className="w-full flex items-center justify-between p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors group">
                  <div className="flex items-center gap-3">
                    <Download size={16} className="text-zinc-500 group-hover:text-emerald-400" />
                    <span className="text-sm font-medium text-zinc-300">Export JSON</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 bg-black px-2 py-1 rounded">Full Backup</span>
                </button>
                
                <button onClick={exportCSV} className="w-full flex items-center justify-between p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors group">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={16} className="text-zinc-500 group-hover:text-green-400" />
                    <span className="text-sm font-medium text-zinc-300">Export CSV</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 bg-black px-2 py-1 rounded">Spreadsheet</span>
                </button>
                
                <div className="relative group">
                   <input type="file" onChange={handleImport} accept=".json" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                   <div className="w-full flex items-center justify-between p-3 bg-zinc-900 group-hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <Upload size={16} className="text-zinc-500 group-hover:text-blue-400" />
                        <span className="text-sm font-medium text-zinc-300">Import Data</span>
                      </div>
                      <span className="text-[10px] text-zinc-600 bg-black px-2 py-1 rounded">Restore</span>
                   </div>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* --- Preferences View --- */}
      {view === 'preferences' && (
        <div className="bg-surface border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-8">
           <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                 <Volume2 size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-white">Experience</h2>
                 <p className="text-zinc-500 text-sm">Customize app behavior.</p>
              </div>
           </div>
           
           <div className="space-y-4">
              {/* Sound */}
              <div onClick={() => handleTogglePreference('soundEnabled')} className="flex items-center justify-between p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl border border-zinc-800 cursor-pointer transition-colors group">
                <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-lg transition-colors ${preferences.soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {preferences.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                   </div>
                   <div>
                      <p className="font-bold text-white text-sm">Sound Effects</p>
                      <p className="text-xs text-zinc-500">Feedback for interactions.</p>
                   </div>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-colors ${preferences.soundEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                   <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${preferences.soundEnabled ? 'left-6' : 'left-1'}`} />
                </div>
              </div>

              {/* Haptics */}
              <div onClick={() => handleTogglePreference('hapticsEnabled')} className="flex items-center justify-between p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl border border-zinc-800 cursor-pointer transition-colors group">
                <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-lg transition-colors ${preferences.hapticsEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {preferences.hapticsEnabled ? <Vibrate size={20} /> : <VibrateOff size={20} />}
                   </div>
                   <div>
                      <p className="font-bold text-white text-sm">Haptic Feedback</p>
                      <p className="text-xs text-zinc-500">Vibrations on mobile.</p>
                   </div>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-colors ${preferences.hapticsEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                   <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${preferences.hapticsEnabled ? 'left-6' : 'left-1'}`} />
                </div>
              </div>

              {/* Privacy Blur */}
              <div onClick={() => handleTogglePreference('privacyBlurEnabled')} className="flex items-center justify-between p-4 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl border border-zinc-800 cursor-pointer transition-colors group">
                <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-lg transition-colors ${preferences.privacyBlurEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {preferences.privacyBlurEnabled ? <Lock size={20} /> : <Eye size={20} />}
                   </div>
                   <div>
                      <p className="font-bold text-white text-sm">Privacy Blur</p>
                      <p className="text-xs text-zinc-500">Blur app when switching windows.</p>
                   </div>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-colors ${preferences.privacyBlurEnabled ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                   <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${preferences.privacyBlurEnabled ? 'left-6' : 'left-1'}`} />
                </div>
              </div>

              {/* Notifications */}
              <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between cursor-pointer" onClick={handleNotificationToggle}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg transition-colors ${preferences.notifications?.enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
                          {preferences.notifications?.enabled ? <Bell size={20} /> : <BellOff size={20} />}
                      </div>
                      <div>
                          <p className="font-bold text-white text-sm">Daily Reminders</p>
                          <p className="text-xs text-zinc-500">Browser notifications.</p>
                      </div>
                    </div>
                    <div className={`w-11 h-6 rounded-full relative transition-colors ${preferences.notifications?.enabled ? 'bg-blue-500' : 'bg-zinc-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${preferences.notifications?.enabled ? 'left-6' : 'left-1'}`} />
                    </div>
                </div>
                
                {/* Permission Warnings */}
                {permissionStatus === 'denied' && (
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-red-400 bg-red-950/20 p-2 rounded-lg border border-red-900/30">
                     <CircleAlert size={12} />
                     <span>Permission Blocked. Enable in Browser Settings.</span>
                  </div>
                )}
                {permissionStatus === 'default' && !preferences.notifications?.enabled && (
                  <div className="mt-2 pl-[52px] text-[10px] text-blue-400">
                     Requires browser permission.
                  </div>
                )}

                {preferences.notifications?.enabled && (
                   <div className="flex items-center gap-3 animate-in slide-in-from-top-2 pt-4 mt-2 border-t border-zinc-800">
                      <span className="text-xs font-bold text-zinc-500 uppercase">Alert Time</span>
                      <input 
                        type="time" 
                        value={preferences.notifications.time}
                        onChange={(e) => handleNotificationTime(e.target.value)}
                        className="bg-black border border-zinc-700 rounded-lg px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                      />
                   </div>
                )}
              </div>
           </div>
           <SaveButton onClick={handleSave} hasChanges={hasUnsavedChanges} />
        </div>
      )}

      {/* --- Info View --- */}
      {view === 'info' && (
         <div className="bg-surface border border-zinc-800 rounded-2xl p-8 text-center space-y-8">
             <div>
               <div className="w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-3xl mx-auto flex items-center justify-center mb-6 border border-zinc-800 shadow-xl">
                  <Target className="text-white w-10 h-10" />
               </div>
               <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Project 50</h2>
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                 <p className="text-xs font-mono text-zinc-400">v{getAppVersion()}</p>
               </div>
             </div>
             
             <div className="grid gap-4 text-left">
                <div className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800">
                   <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Shield size={16} className="text-emerald-500" />
                      Local & Private
                   </h3>
                   <p className="text-xs text-zinc-400 leading-relaxed">
                      Your journey belongs to you. All data is stored locally on this device. 
                      We use Google Gemini solely for AI coaching features, and your personal prompts are anonymous.
                   </p>
                </div>
                
                <div className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800">
                   <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <CircleHelp size={16} className="text-purple-500" />
                      Philosophy
                   </h3>
                   <p className="text-xs text-zinc-400 leading-relaxed">
                      Consistency is the only currency that matters. 
                      Strict Mode is designed to forge resilience—failure has consequences. 
                      Embrace the reset.
                   </p>
                </div>
             </div>
             
             <div className="pt-8 border-t border-zinc-800">
               <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Built for Discipline</p>
             </div>
         </div>
      )}

      {/* --- Danger Zone --- */}
      {view === 'danger' && (
        <div className="bg-red-950/10 border border-red-900/30 rounded-2xl p-6 md:p-8 space-y-6">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                 <TriangleAlert size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
                 <p className="text-red-400/60 text-sm">Irreversible actions.</p>
              </div>
           </div>
           
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-950/20 rounded-xl border border-red-900/30">
                 <div>
                    <p className="font-bold text-white text-sm">Reset Progress</p>
                    <p className="text-xs text-red-400/70 mt-0.5">Wipe all history and start over.</p>
                 </div>
                 <button 
                   onClick={handleReset}
                   className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-red-900/20"
                 >
                   Reset App
                 </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-950/20 rounded-xl border border-red-900/30">
                 <div>
                    <p className="font-bold text-white text-sm">Rewind Time</p>
                    <p className="text-xs text-red-400/70 mt-0.5">Move back 1 day (Data risk).</p>
                 </div>
                 <button 
                   onClick={handleRewindDay}
                   className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors border border-zinc-700"
                 >
                   Rewind 1 Day
                 </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-950/20 rounded-xl border border-red-900/30">
                 <div>
                    <p className="font-bold text-white text-sm">Force Day Override</p>
                    <p className="text-xs text-red-400/70 mt-0.5">Jump to specific day.</p>
                 </div>
                 <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={manualDayInput}
                      onChange={(e) => setManualDayInput(Number(e.target.value))}
                      className="w-16 bg-black/50 border border-red-900/50 rounded-lg px-2 py-1 text-white text-xs text-center"
                    />
                    <button 
                      onClick={handleManualDaySet}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors border border-zinc-700"
                    >
                      Set Day
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};