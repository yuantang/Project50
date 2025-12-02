import React, { useRef, useState } from 'react';
import { MoodSelector } from './MoodSelector';
import { Mood } from '../types';
import { Camera, X, ImageIcon, Sparkles, Loader2, Lightbulb, CheckCircle2 } from 'lucide-react';
import { getJournalInsight } from '../services/geminiService';

interface DailyJournalProps {
  note: string;
  mood?: Mood;
  photo?: string;
  onNoteChange: (note: string) => void;
  onMoodChange: (mood: Mood) => void;
  onPhotoChange: (photo: string | undefined) => void;
  disabled?: boolean;
  highlight?: boolean;
}

export const DailyJournal: React.FC<DailyJournalProps> = ({
  note,
  mood,
  photo,
  onNoteChange,
  onMoodChange,
  onPhotoChange,
  disabled,
  highlight
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // Derived state: Is the journal "complete"?
  const isCompleted = !!mood && note.trim().length > 0;

  // Canvas-based image compression
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const maxWidth = 800; // Resize to max 800px width
      const quality = 0.6; // 60% JPEG quality

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        const compressedBase64 = await compressImage(file);
        onPhotoChange(compressedBase64);
      } catch (error) {
        console.error("Compression failed", error);
        alert("Failed to process image.");
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const triggerFileSelect = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleAnalyze = async () => {
    if (!note || !mood || isAnalyzing) return;
    setIsAnalyzing(true);
    setInsight(null);
    const result = await getJournalInsight(note, mood);
    setInsight(result);
    setIsAnalyzing(false);
  };

  return (
    <div 
      id="daily-journal"
      className={`
        bg-surface border rounded-xl overflow-hidden mt-6 transition-all duration-500 relative
        ${highlight 
          ? 'border-indigo-500 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] ring-1 ring-indigo-500' 
          : isCompleted 
            ? 'border-emerald-500/50 shadow-[0_0_15px_-5px_rgba(16,185,129,0.1)]'
            : 'border-zinc-800'}
      `}
    >
      {/* Global Noise Texture */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-noise mix-blend-overlay" />

      {isCompleted && (
        <div className="absolute top-0 right-0 p-4 z-20 pointer-events-none animate-in fade-in zoom-in">
           <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
             <CheckCircle2 size={12} />
             Logged
           </div>
        </div>
      )}

      <div className={`p-4 border-b flex justify-between items-center transition-colors relative z-10 ${isCompleted ? 'bg-emerald-950/10 border-emerald-500/20' : 'bg-zinc-900/50 border-zinc-800'}`}>
        <h3 className={`font-semibold flex items-center gap-2 transition-colors ${highlight ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-white'}`}>
          Daily Journal
        </h3>
        <span className="text-xs text-zinc-500 uppercase tracking-wider pr-20 md:pr-0">Evidence & Reflection</span>
      </div>
      
      <div className="p-4 space-y-6 relative z-10">
        {/* Photo Section */}
        <div>
          <label className="block text-sm text-zinc-400 mb-3">Photo Evidence</label>
          
          {!photo ? (
            <button 
              onClick={triggerFileSelect}
              disabled={disabled || isCompressing}
              className={`
                w-full h-32 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-2
                transition-all group
                ${disabled ? 'cursor-default opacity-50' : 'hover:border-zinc-600 hover:bg-zinc-900/50 cursor-pointer'}
              `}
            >
              {isCompressing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  <span className="text-xs text-emerald-500">Compressing...</span>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-zinc-900 rounded-full group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-zinc-400" />
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">Upload photo of progress</span>
                </>
              )}
            </button>
          ) : (
            <div className="relative w-full h-64 rounded-xl overflow-hidden group">
              <img 
                src={photo} 
                alt="Daily evidence" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                {!disabled && (
                  <>
                    <button 
                      onClick={triggerFileSelect}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
                      title="Change photo"
                    >
                      <ImageIcon size={20} />
                    </button>
                    <button 
                      onClick={() => onPhotoChange(undefined)}
                      className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors"
                      title="Remove photo"
                    >
                      <X size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Mood Section */}
        <div>
          <label className="block text-sm text-zinc-400 mb-3">How do you feel today?</label>
          <MoodSelector 
            selected={mood} 
            onSelect={onMoodChange} 
            disabled={disabled}
          />
        </div>

        {/* Text Section */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Thoughts & Progress</label>
          <div className="relative">
            <textarea
              value={note || ''}
              onChange={(e) => onNoteChange(e.target.value)}
              disabled={disabled}
              placeholder={disabled ? "No reflection recorded." : "What went well? What was difficult? Write your thoughts..."}
              className={`
                w-full bg-black/20 border rounded-lg p-4 text-sm text-zinc-300 
                placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 
                transition-all resize-none min-h-[120px]
                ${isCompleted ? 'border-emerald-900/30' : 'border-zinc-700/50'}
                ${disabled ? 'cursor-default opacity-80' : ''}
              `}
            />
            {/* AI Analyze Button */}
            {!disabled && note && mood && note.length > 10 && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-500/30 transition-colors backdrop-blur-sm"
              >
                {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Insight
              </button>
            )}
          </div>
          
          {/* AI Insight Result */}
          {insight && (
            <div className="mt-4 p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-2">
              <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                 <p className="text-sm text-indigo-200 italic">"{insight}"</p>
                 <p className="text-[10px] text-indigo-400/60 mt-1 uppercase tracking-wide font-medium">Gemini Analysis</p>
              </div>
              <button onClick={() => setInsight(null)} className="text-indigo-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};