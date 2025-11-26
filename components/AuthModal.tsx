
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { X, Mail, Loader2, AlertTriangle } from 'lucide-react';
import { soundService } from '../services/soundService';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Only used for signup/signin with email
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
       setError("Supabase is not configured. Please check configuration.");
       return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
        setMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        soundService.playSuccess();
        onLoginSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      soundService.playError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 relative shadow-2xl animate-in zoom-in-95">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">
           {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
           Sync your data across devices and never lose your streak.
        </p>

        {!isSupabaseConfigured() && (
           <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg flex items-center gap-2 text-yellow-500 text-xs">
              <AlertTriangle size={16} />
              <span>Database connection failed. Check credentials.</span>
           </div>
        )}

        {/* Social Logins Hidden for MVP */}
        
        <form onSubmit={handleEmailAuth} className="space-y-4">
           <div>
             <input
               type="email"
               required
               placeholder="Email address"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="w-full bg-black/30 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
             />
           </div>
           <div>
             <input
               type="password"
               required
               placeholder="Password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               minLength={6}
               className="w-full bg-black/30 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
             />
           </div>
           
           {error && <p className="text-red-400 text-xs">{error}</p>}

           <button
             type="submit"
             disabled={loading || !isSupabaseConfigured()}
             className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
           >
             {loading ? <Loader2 className="animate-spin" size={20} /> : <Mail size={20} />}
             {mode === 'signin' ? 'Sign In' : 'Sign Up'}
           </button>
        </form>

        <div className="mt-6 text-center">
           <button 
             onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
             className="text-xs text-zinc-400 hover:text-white transition-colors"
           >
             {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
           </button>
        </div>
      </div>
    </div>
  );
};
