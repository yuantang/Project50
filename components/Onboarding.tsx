
import React, { useState } from 'react';
import { ArrowRight, Fingerprint, PenTool, ShieldCheck } from 'lucide-react';
import { soundService } from '../services/soundService';

interface OnboardingProps {
  onComplete: (name: string, manifesto: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [name, setName] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  const handleNext = () => {
    soundService.playClick();
    if (step === 0 && name.trim()) setStep(1);
    else if (step === 1 && manifesto.trim()) setStep(2);
  };

  const handleSign = () => {
    soundService.playComplete();
    setIsSigning(true);
    setTimeout(() => {
      onComplete(name, manifesto);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Step 0: Identity */}
        {step === 0 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center border border-zinc-800 mb-6">
              <Fingerprint className="text-emerald-500 w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Identify Yourself</h1>
            <p className="text-zinc-500">Who is taking this challenge?</p>
            
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-transparent border-b-2 border-zinc-800 py-4 text-center text-2xl text-white focus:border-emerald-500 focus:outline-none transition-colors font-serif placeholder:text-zinc-700"
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            />

            <button
              onClick={handleNext}
              disabled={!name.trim()}
              className="group flex items-center gap-2 mx-auto text-zinc-400 hover:text-white transition-colors disabled:opacity-0"
            >
              Next <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Step 1: Manifesto */}
        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center border border-zinc-800 mb-6">
              <PenTool className="text-purple-500 w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Define Your Why</h1>
            <p className="text-zinc-500">Why are you doing this? Be specific.</p>
            
            <textarea
              autoFocus
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value)}
              placeholder="I commit to becoming the best version of myself because..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-lg text-white focus:border-purple-500 focus:outline-none transition-colors min-h-[150px] resize-none leading-relaxed"
            />

            <button
              onClick={handleNext}
              disabled={!manifesto.trim()}
              className="group flex items-center gap-2 mx-auto text-zinc-400 hover:text-white transition-colors disabled:opacity-0"
            >
              Review Contract <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Step 2: Contract */}
        {step === 2 && (
          <div className="space-y-8 animate-in zoom-in-95 fade-in duration-700">
             <div className="bg-zinc-50 text-black p-8 rounded-sm shadow-2xl transform rotate-1 relative max-h-[60vh] overflow-y-auto">
                <div className="absolute top-4 right-4 opacity-20">
                  <ShieldCheck size={64} />
                </div>
                
                <h2 className="text-2xl font-serif font-bold mb-6 border-b-2 border-black pb-4">COMMITMENT CONTRACT</h2>
                
                <div className="text-left space-y-4 font-serif text-sm leading-relaxed opacity-90">
                  <p>I, <span className="font-bold underline uppercase">{name}</span>, hereby commit to the Project 50 challenge.</p>
                  <p>For the next 50 days, I pledge to execute my habits with relentless discipline, regardless of mood, weather, or circumstance.</p>
                  <p>My Purpose:</p>
                  <p className="italic pl-4 border-l-2 border-black/20">"{manifesto}"</p>
                  <p>I understand that excuses are irrelevant and results are binary. I am fully responsible for my outcome.</p>
                </div>

                <div className="mt-8 pt-8 border-t-2 border-black flex justify-between items-end">
                   <div className="text-left">
                     <p className="text-[10px] uppercase font-bold tracking-widest mb-2">DATE</p>
                     <p className="font-mono text-xs">{new Date().toLocaleDateString()}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] uppercase font-bold tracking-widest mb-1">SIGNATURE</p>
                     <div className="font-script text-xl transform -rotate-2 text-blue-900">
                       {isSigning ? name : <span className="opacity-10">Sign Below</span>}
                     </div>
                   </div>
                </div>
             </div>

             <button
              onClick={handleSign}
              disabled={isSigning}
              className={`
                w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95
                ${isSigning 
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                  : 'bg-white text-black hover:bg-zinc-200'}
              `}
            >
              {isSigning ? 'Processing...' : 'Sign & Commit'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
