
import React, { useState, useEffect } from 'react';
import { 
  User, Target, HardDrive, AlertTriangle, ChevronLeft, ChevronRight, 
  Bot, ArrowUp, ArrowDown, Trash, Plus, Download, Upload, FileSpreadsheet, 
  Eraser, Info, Shield, HelpCircle, Volume2, VolumeX, Vibrate, VibrateOff
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { UserProgress, Habit, DEFAULT_HABITS } from '../types';
import { 
  saveProgress, resetChallenge, startChallenge, exportData, 
  exportCSV, importData, getStorageUsage, clearOldPhotos, getAppVersion 
} from '../services/storageService';
import { soundService } from '../services/soundService';

type SettingsState = 'menu' | 'account' | 'challenge' | 'data' | 'preferences' | 'info' | 'danger';
type InfoState = 'menu' | 'about' | 'privacy' | 'help';

// Available icons for custom habits
const ICON_OPTIONS = [
  'Activity', 'AlarmClock', 'Apple', 'Bike', 'Book', 'BookOpen', 
  'Brain', 'Camera', 'SquareCheck', 'Coffee', 'Code', 'Dumbbell', 
  'Droplet', 'Flame', 'Flower2', 'Gamepad2', 'Heart', 'Moon', 
  'Music', 'Palette', 'PenTool', 'Footprints', 'Sun', 'Target', 'Zap'
];

const TEMPLATES = [
  {
    name: 'Project 50 (Standard)',
    days: 50,
    habits: DEFAULT_HABITS
  },
  {
    name: '75 Hard Style',
    days: 75,
    habits: [
      { id: 'diet', label: 'Strict Diet (No Cheat Meals)', description: 'Stick to a plan.', icon: 'Apple' },
      { id: 'water', label: '1 Gallon Water', description: 'Hydrate.', icon: 'Droplet' },
      { id: 'workout1', label: '45m Workout (Indoor)', description: 'Gym or weights.', icon: 'Dumbbell' },
      { id: 'workout2', label: '45m Workout (Outdoor)', description: 'Must be outside.', icon: 'Sun' },
      { id: 'read', label: 'Read 10 Pages', description: 'Non-fiction.', icon: 'BookOpen' },
      { id: 'photo', label: 'Progress Photo', description: 'Take a daily picture.', icon: 'Camera' },
    ]
  },
  {
    name: 'Dopamine Detox',
    days: 30,
    habits: [
      { id: 'social', label: 'No Social Media', description: 'Zero scrolling.', icon: 'XCircle' },
      { id: 'meditate', label: 'Meditate 20m', description: 'Mindfulness.', icon: 'Brain' },
      { id: 'journal', label: 'Journaling', description: 'Write thoughts.', icon: 'PenTool' },
      { id: 'nature', label: 'Nature Walk', description: '30 mins outside.', icon: 'Footprints' },
      { id: 'read', label: 'Read 1 hr', description: 'Deep reading.', icon: 'Book' },
    ]
  },
  {
    name: 'Monk Mode',
    days: 21,
    habits: [
      { id: 'monk_morning', label: 'Monk Morning', description: 'No phone for 1h.', icon: 'Sun' },
      { id: 'meditate', label: 'Meditate 30m', description: 'Silence.', icon: 'Brain' },
      { id: 'deep_work', label: 'Deep Work 4h', description: 'Zero distractions.', icon: 'Briefcase' },
      { id: 'exercise', label: 'Exercise 1h', description: 'Move body.', icon: 'Dumbbell' },
      { id: 'diet', label: 'Clean Diet', description: 'Whole foods only.', icon: 'Apple' },
      { id: 'read', label: 'Read 30m', description: 'Wisdom.', icon: 'BookOpen' },
    ]
  }
];

interface SettingsViewProps {
  progress: UserProgress;
  onUpdate: (newProgress: UserProgress) => void;
  onReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ progress, onUpdate, onReset }) => {
  const [view, setView] = useState<SettingsState>('menu');
  const [infoView, setInfoView] = useState<InfoState>('menu');
  
  // Local Edit State
  const [editName, setEditName] = useState(progress.userName || "");
  const [editPersona, setEditPersona] = useState(progress.aiPersona || 'stoic');
  const [editHabits, setEditHabits] = useState<Habit[]>(progress.customHabits);
  const [editDays, setEditDays] = useState(progress.totalDays);
  const [editStrictMode, setEditStrictMode] = useState(progress.strictMode);
  const [preferences, setPreferences] = useState(progress.preferences || { soundEnabled: true, hapticsEnabled: true });
  
  const [newHabitLabel, setNewHabitLabel] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("Target");
  const [storageStats, setStorageStats] = useState(getStorageUsage());
  const [manualDayInput, setManualDayInput] = useState(progress.currentDay);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    const isDirty = 
      JSON.stringify(editHabits) !== JSON.stringify(progress.customHabits) ||
      editDays !== progress.totalDays ||
      editStrictMode !== progress.strictMode ||
      editName !== (progress.userName || "") ||
      editPersona !== progress.aiPersona ||
      JSON.stringify(preferences) !== JSON.stringify(progress.preferences);
    
    setHasUnsavedChanges(isDirty);
  }, [editHabits, editDays, editStrictMode, editName, editPersona, preferences, progress]);

  // Refresh storage stats when entering data view
  useEffect(() => {
    if (view === 'data') setStorageStats(getStorageUsage());
  }, [view]);

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
      preferences: preferences
    };
    onUpdate(newProgress);
    setHasUnsavedChanges(false);
    soundService.playSuccess();
    alert("Settings saved!");
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
  };

  const handleUpdateHabit = (id: string, key: keyof Habit, value: string) => {
    setEditHabits(prev => prev.map(h => h.id === id ? { ...h, [key]: value } : h));
  };

  const handleRemoveHabit = (id: string) => {
    setEditHabits(editHabits.filter(h => h.id !== id));
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
    const newHabits = template.habits.map(h => ({ ...h }));
    setEditHabits(newHabits);
    setEditDays(template.days);
    soundService.playClick();
  };

  const handleTogglePreference = (key: keyof typeof preferences) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    // Update sound service immediately
    soundService.updateSettings(newPrefs.soundEnabled, newPrefs.hapticsEnabled);
    // Note: This will cause unsaved changes, user must click save to persist
  };

  const handleReset = () => {
    if (confirm("Are you sure? This will delete all progress and reset to defaults.")) {
      onReset();
    }
  };

  const handleRewindDay = () => {
    if (progress.currentDay <= 1) return;
    if (confirm("⚠️ DANGER: Rewinding the day will move your progress cursor back. Existing data might be overwritten. Continue?")) {
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
        <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
        
        {[
          { id: 'account', icon: User, label: 'Account', sub: 'Profile, Identity, AI Persona', color: 'text-white' },
          { id: 'challenge', icon: Target, label: 'Challenge Config', sub: 'Habits, Duration, Strict Mode', color: 'text-emerald-500' },
          { id: 'data', icon: HardDrive, label: 'Data & Storage', sub: 'Backup, Restore, Usage', color: 'text-blue-500' },
          { id: 'preferences', icon: Volume2, label: 'Preferences', sub: 'Sound, Haptics', color: 'text-purple-500' },
          { id: 'info', icon: Info, label: 'App Info', sub: 'About, Privacy, Help', color: 'text-zinc-400' },
          { id: 'danger', icon: AlertTriangle, label: 'Danger Zone', sub: 'Reset, Rewind, Override', color: 'text-red-500' },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setView(item.id as SettingsState)}
            className={`w-full flex items-center justify-between p-4 bg-surface hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all group ${item.id === 'danger' ? 'hover:border-red-900/50 hover:bg-red-950/10' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-zinc-900 rounded-lg ${item.color}`}>
                <item.icon size={20} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">{item.label}</p>
                <p className="text-xs text-zinc-500">{item.sub}</p>
              </div>
            </div>
            <ChevronRight className="text-zinc-600 group-hover:text-white transition-colors" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
      <button 
        onClick={() => {
            if (view === 'info' && infoView !== 'menu') {
                setInfoView('menu');
            } else {
                setView('menu');
            }
        }}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <ChevronLeft size={20} />
        Back
      </button>

      {/* --- Account View --- */}
      {view === 'account' && (
        <div className="p-6 bg-surface border border-zinc-800 rounded-xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User size={20} className="text-zinc-400" />
            Account Settings
          </h2>
          
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Display Name</label>
            <input 
              type="text" 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-white w-full max-w-xs"
              placeholder="Your Name"
            />
          </div>
          
          <div>
            <label className="block text-sm text-zinc-400 mb-2">AI Coach Persona</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['sergeant', 'stoic', 'empathetic'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setEditPersona(p)}
                  className={`p-3 rounded-lg border text-left transition-all ${editPersona === p ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Bot size={16} />
                    <span className="font-bold capitalize">{p}</span>
                  </div>
                  <p className="text-[10px] opacity-80">
                    {p === 'sergeant' && "Aggressive. David Goggins style."}
                    {p === 'stoic' && "Rational. Marcus Aurelius style."}
                    {p === 'empathetic' && "Gentle. Supportive friend."}
                  </p>
                </button>
              ))}
            </div>
          </div>
          <SaveButton onClick={handleSave} hasChanges={hasUnsavedChanges} />
        </div>
      )}

      {/* --- Challenge View --- */}
      {view === 'challenge' && (
        <div className="p-6 bg-surface border border-zinc-800 rounded-xl space-y-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Target size={20} className="text-emerald-500" />
              Challenge Configuration
          </h2>

          <div>
              <label className="block text-sm text-zinc-400 mb-2">Apply Template</label>
              <div className="flex gap-2 flex-wrap">
                {TEMPLATES.map(t => {
                  const isActive = JSON.stringify(editHabits.map(h => h.id)) === JSON.stringify(t.habits.map(h => h.id));
                  return (
                    <button
                      key={t.name}
                      onClick={() => handleApplyTemplate(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${isActive ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-zinc-900 border-zinc-700 hover:border-emerald-500/50 text-zinc-400'}`}
                    >
                      {t.name}
                    </button>
                  )
                })}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
              <label className="block text-sm text-zinc-400 mb-2">Duration (Days)</label>
              <input 
                type="number" 
                value={editDays}
                onChange={(e) => setEditDays(Number(e.target.value))}
                className="bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-white w-full"
                min="1" max="365"
              />
              </div>
              <div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50 h-full mt-1">
                <button 
                  onClick={() => setEditStrictMode(!editStrictMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${editStrictMode ? 'bg-orange-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${editStrictMode ? 'left-7' : 'left-1'}`} />
                </button>
                <div className="leading-tight">
                  <span className="text-white font-medium block text-sm">Strict Mode</span>
                  <span className="text-[10px] text-zinc-500">Failing a day resets progress to Day 1.</span>
                </div>
              </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-4">Habits</label>
            <div className="space-y-3 mb-6">
              {editHabits.map((habit, index) => (
                <div key={habit.id} className="flex items-start gap-3 bg-zinc-900 p-3 rounded-lg border border-zinc-800 group hover:border-zinc-700 transition-colors">
                  <div className="flex flex-col gap-1 mr-2 mt-1">
                      <button onClick={() => handleMoveHabit(index, -1)} className="text-zinc-600 hover:text-white disabled:opacity-30" disabled={index === 0}><ArrowUp size={12} /></button>
                      <button onClick={() => handleMoveHabit(index, 1)} className="text-zinc-600 hover:text-white disabled:opacity-30" disabled={index === editHabits.length - 1}><ArrowDown size={12} /></button>
                  </div>
                  <div className="p-2 bg-zinc-800 rounded-md text-zinc-400 mt-0.5">
                    {(() => {
                      const IconComp = (Icons as any)[habit.icon || 'Circle'] || Icons.Circle;
                      return <IconComp size={16} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <input
                        type="text"
                        value={habit.label}
                        onChange={(e) => handleUpdateHabit(habit.id, 'label', e.target.value)}
                        className="bg-transparent border border-transparent hover:border-zinc-700 focus:border-zinc-500 rounded px-2 py-0.5 text-zinc-200 text-sm font-medium focus:outline-none w-full"
                        placeholder="Habit Name"
                      />
                      <input
                        type="text"
                        value={habit.description}
                        onChange={(e) => handleUpdateHabit(habit.id, 'description', e.target.value)}
                        className="bg-transparent border border-transparent hover:border-zinc-700 focus:border-zinc-600 rounded px-2 py-0.5 text-zinc-500 text-xs focus:outline-none w-full"
                        placeholder="Short description"
                      />
                  </div>
                  <button onClick={() => handleRemoveHabit(habit.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors mt-0.5">
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
              <h3 className="text-sm font-medium text-white mb-3">Add New Habit</h3>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newHabitLabel}
                    onChange={(e) => setNewHabitLabel(e.target.value)}
                    placeholder="e.g., Meditate 10 mins"
                    className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                  />
                  <button onClick={handleAddHabit} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                  {ICON_OPTIONS.map(icon => {
                    const IconComp = (Icons as any)[icon];
                    if (!IconComp) return null;
                    return (
                      <button
                        key={icon}
                        onClick={() => setNewHabitIcon(icon)}
                        className={`p-2 rounded-md transition-all ${newHabitIcon === icon ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                      >
                        <IconComp size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <SaveButton onClick={handleSave} hasChanges={hasUnsavedChanges} />
        </div>
      )}

      {/* --- Data View --- */}
      {view === 'data' && (
        <div className="space-y-6">
          <div className="p-6 bg-surface border border-zinc-800 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HardDrive size={20} className="text-blue-500" />
                Storage Usage
              </h2>
              <span className={`text-xs font-bold ${storageStats.percent > 80 ? 'text-red-500' : 'text-zinc-500'}`}>
                {storageStats.percent}%
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full transition-all duration-500 ${storageStats.percent > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${storageStats.percent}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mb-4">{storageStats.usedKB}KB used of ~5MB browser limit.</p>
            <button 
              onClick={() => {
                  if (confirm("Delete photos older than 30 days?")) {
                      clearOldPhotos(30);
                      setStorageStats(getStorageUsage());
                  }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors border border-zinc-700"
            >
              <Eraser size={14} />
              Clean Old Photos
            </button>
          </div>

          <div className="p-6 bg-surface border border-zinc-800 rounded-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Download size={20} className="text-emerald-500" />
                Backup & Restore
              </h2>
              <div className="flex flex-wrap gap-4">
              <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700">
                <Download size={16} /> JSON
              </button>
              <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700">
                <FileSpreadsheet size={16} /> CSV
              </button>
              <div className="relative">
                <input type="file" onChange={handleImport} accept=".json" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700 pointer-events-none">
                  <Upload size={16} /> Import
                </button>
              </div>
              </div>
          </div>
        </div>
      )}

      {/* --- Preferences View --- */}
      {view === 'preferences' && (
        <div className="p-6 bg-surface border border-zinc-800 rounded-xl space-y-6">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Volume2 size={20} className="text-purple-500" />
              App Preferences
           </h2>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                      {preferences.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                   </div>
                   <div>
                      <p className="font-medium text-white">Sound Effects</p>
                      <p className="text-xs text-zinc-500">UI clicks and success sounds</p>
                   </div>
                </div>
                <button 
                   onClick={() => handleTogglePreference('soundEnabled')}
                   className={`w-12 h-6 rounded-full relative transition-colors ${preferences.soundEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                   <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${preferences.soundEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                      {preferences.hapticsEnabled ? <Vibrate size={20} /> : <VibrateOff size={20} />}
                   </div>
                   <div>
                      <p className="font-medium text-white">Haptic Feedback</p>
                      <p className="text-xs text-zinc-500">Vibration on interaction</p>
                   </div>
                </div>
                <button 
                   onClick={() => handleTogglePreference('hapticsEnabled')}
                   className={`w-12 h-6 rounded-full relative transition-colors ${preferences.hapticsEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                   <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${preferences.hapticsEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
           </div>
           <SaveButton onClick={handleSave} hasChanges={hasUnsavedChanges} />
        </div>
      )}

      {/* --- Info View (Nested) --- */}
      {view === 'info' && (
         <div className="bg-surface border border-zinc-800 rounded-xl overflow-hidden">
            {infoView === 'menu' ? (
               <div>
                  <div className="p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                       <Info size={20} className="text-zinc-400" />
                       App Info
                    </h2>
                  </div>
                  <button onClick={() => setInfoView('about')} className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 border-b border-zinc-800 transition-colors">
                     <span className="text-zinc-200">About Project 50</span>
                     <ChevronRight size={16} className="text-zinc-600" />
                  </button>
                  <button onClick={() => setInfoView('privacy')} className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 border-b border-zinc-800 transition-colors">
                     <span className="text-zinc-200">Privacy Policy</span>
                     <ChevronRight size={16} className="text-zinc-600" />
                  </button>
                  <button onClick={() => setInfoView('help')} className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors">
                     <span className="text-zinc-200">Help & FAQ</span>
                     <ChevronRight size={16} className="text-zinc-600" />
                  </button>
               </div>
            ) : (
               <div className="p-6 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center gap-2 mb-6">
                     <button onClick={() => setInfoView('menu')} className="text-zinc-500 hover:text-white"><ChevronLeft size={20}/></button>
                     <h3 className="text-lg font-bold text-white capitalize">{infoView}</h3>
                  </div>
                  
                  {infoView === 'about' && (
                     <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
                        <p className="text-white font-medium">Project 50 Tracker v{getAppVersion()}</p>
                        <p>This application is designed to help you build discipline through consistency. Inspired by the "Project 50" challenge, it tracks your daily habits, mood, and transformation journey.</p>
                        <p>Powered by Gemini AI for personalized coaching and analysis.</p>
                        <p className="pt-4 text-xs opacity-50">Built with React, Tailwind, Lucide, and Google Gemini.</p>
                     </div>
                  )}

                  {infoView === 'privacy' && (
                     <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
                        <div className="flex items-center gap-2 text-emerald-500 mb-2">
                           <Shield size={18} />
                           <span className="font-bold">Local-First Architecture</span>
                        </div>
                        <p>Your data is yours. All progress, photos, and journals are stored <strong className="text-white">locally on your device</strong> via Browser LocalStorage.</p>
                        <p>We do not send your personal habit data to any cloud server for storage. The only data transmission occurs when interacting with Gemini AI (Google) for coaching and analysis, where strictly necessary text contexts are processed ephemerally.</p>
                        <p className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-red-300 mt-4">
                           Important: Clearing your browser cache/data will delete your progress. Please use the "Backup (JSON)" feature in Data Settings regularly.
                        </p>
                     </div>
                  )}

                  {infoView === 'help' && (
                     <div className="space-y-6 text-zinc-400 text-sm">
                        <div>
                           <h4 className="text-white font-bold flex items-center gap-2 mb-1"><HelpCircle size={14}/> What happens if I miss a day?</h4>
                           <p>In Standard Mode, you simply break your streak. In <span className="text-orange-500">Strict Mode</span>, the app will prompt you to reset to Day 1, as per the challenge rules.</p>
                        </div>
                        <div>
                           <h4 className="text-white font-bold flex items-center gap-2 mb-1"><HelpCircle size={14}/> How do Streak Freezes work?</h4>
                           <p>You can buy Freezes with XP in the Shop. If you fail a day, a popup will ask if you want to consume a Freeze to save your streak.</p>
                        </div>
                        <div>
                           <h4 className="text-white font-bold flex items-center gap-2 mb-1"><HelpCircle size={14}/> My storage is full?</h4>
                           <p>Browsers limit storage to ~5MB. Photos take up the most space. Go to Data Settings and use "Clean Old Photos" to free up space without losing your stats.</p>
                        </div>
                     </div>
                  )}
               </div>
            )}
         </div>
      )}

      {/* --- Danger Zone View --- */}
      {view === 'danger' && (
        <div className="p-6 bg-red-950/10 border border-red-900/50 rounded-xl">
          <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
            <AlertTriangle size={20} />
            Danger Zone
          </h2>
          <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border border-red-900/30 rounded-lg bg-black/20">
                <div>
                  <p className="text-white font-medium">Rewind Day Cursor</p>
                  <p className="text-xs text-zinc-500">Go back one day.</p>
                </div>
                <button onClick={handleRewindDay} className="text-orange-400 hover:text-orange-300 text-sm px-3 py-2 rounded-lg bg-orange-950/30 border border-orange-900/50">Rewind</button>
              </div>
              
              <div className="flex justify-between items-center p-4 border border-red-900/30 rounded-lg bg-black/20">
                <div>
                  <p className="text-white font-medium">Manual Day Override</p>
                  <p className="text-xs text-zinc-500">Force set day number.</p>
                  <input 
                    type="number" 
                    value={manualDayInput} 
                    onChange={(e) => setManualDayInput(Number(e.target.value))}
                    className="mt-2 bg-black/50 border border-zinc-700 rounded px-2 py-1 text-white w-20"
                  />
                </div>
                <button onClick={handleManualDaySet} className="text-orange-400 hover:text-orange-300 text-sm px-3 py-2 rounded-lg bg-orange-950/30 border border-orange-900/50">Set Day</button>
              </div>

              <div className="flex justify-between items-center p-4 border border-red-900/30 rounded-lg bg-black/20">
                <div>
                  <p className="text-white font-medium">Factory Reset</p>
                  <p className="text-xs text-zinc-500">Delete everything.</p>
                </div>
                <button onClick={handleReset} className="text-red-400 hover:text-red-300 text-sm px-3 py-2 rounded-lg bg-red-950/30 border border-red-900/50">Reset</button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SaveButton: React.FC<{ onClick: () => void; hasChanges: boolean }> = ({ onClick, hasChanges }) => (
  <div className="flex justify-end pt-4 border-t border-zinc-800">
      <button 
        onClick={onClick} 
        className={`
          px-6 py-2 rounded-lg font-bold transition-all shadow-lg
          ${hasChanges 
            ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20 animate-pulse' 
            : 'bg-white text-black hover:bg-zinc-200 shadow-white/10'}
        `}
      >
        Save Changes
      </button>
  </div>
);
