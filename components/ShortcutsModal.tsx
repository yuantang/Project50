import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const shortcuts = [
    { keys: ['1', '-', '9'], description: 'Toggle habit by number' },
    { keys: ['Cmd', 'Enter'], description: 'Complete the day' },
    { keys: ['Shift', '?'], description: 'Show this help' },
    { keys: ['Esc'], description: 'Close modals' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-zinc-800 rounded-xl text-zinc-400 border border-zinc-700">
            <Keyboard size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
            <p className="text-sm text-zinc-500">Power user controls</p>
          </div>
        </div>

        <div className="space-y-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-zinc-800/50">
               <span className="text-zinc-300 font-medium text-sm">{s.description}</span>
               <div className="flex gap-1">
                 {s.keys.map(k => (
                   <kbd key={k} className="px-2 py-1 bg-zinc-800 rounded-md border border-zinc-700 text-xs font-mono text-zinc-400 min-w-[24px] text-center shadow-sm">
                     {k}
                   </kbd>
                 ))}
               </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center text-xs text-zinc-600">
          Shortcuts are disabled when typing in text fields.
        </div>
      </div>
    </div>
  );
};