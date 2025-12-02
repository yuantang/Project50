// Simple Audio Service using Web Audio API

export type NoiseType = 'brown' | 'pink' | 'white';

class SoundService {
  private ctx: AudioContext | null = null;
  private volume: number = 0.15;
  
  // Focus Noise State
  private noiseNode: ScriptProcessorNode | null = null;
  private noiseGain: GainNode | null = null;
  private isNoisePlaying: boolean = false;
  private currentNoiseType: NoiseType = 'brown';

  // Preferences
  private soundEnabled: boolean = true;
  private hapticsEnabled: boolean = true;

  public updateSettings(soundEnabled: boolean, hapticsEnabled: boolean) {
    this.soundEnabled = soundEnabled;
    this.hapticsEnabled = hapticsEnabled;
    if (!this.soundEnabled) {
      this.toggleFocusNoise(false);
    }
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Auto-resume if suspended (browser policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // --- Haptic Feedback ---
  
  public vibrate(pattern: number | number[]) {
    if (!this.hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  // --- Sound Effects ---

  public playClick() {
    this.playTone(800, 'sine', 0.05);
    this.vibrate(10);
  }

  public playTick() {
    // Mechanical Haptic (Very short, sharp tap)
    this.vibrate(5); 
    
    if (!this.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Mechanical Click: rapid frequency drop
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.03);
      
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime); 
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch(e) {
      // Ignore
    }
  }

  public playComplete() {
    this.playTone(1200, 'triangle', 0.1);
    setTimeout(() => this.playTone(1800, 'sine', 0.1), 50);
    this.vibrate([15, 30, 15]);
  }

  public playSuccess() {
    this.playTone(440, 'sine', 0.4);
    setTimeout(() => this.playTone(554.37, 'sine', 0.4), 80);
    setTimeout(() => this.playTone(659.25, 'sine', 0.5), 160);
    this.vibrate([50, 50, 50, 50, 100]);
  }

  public playError() {
    this.playTone(150, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(100, 'sawtooth', 0.2), 100);
    this.vibrate([100, 50, 100]);
  }

  public playLevelUp() {
    this.playTone(523.25, 'square', 0.1);
    setTimeout(() => this.playTone(659.25, 'square', 0.1), 100);
    setTimeout(() => this.playTone(783.99, 'square', 0.1), 200);
    setTimeout(() => this.playTone(1046.50, 'square', 0.4), 300);
    this.vibrate([30, 30, 30, 30, 200]);
  }

  public playTimerStart() {
    this.playTone(600, 'sine', 0.1);
    setTimeout(() => this.playTone(800, 'sine', 0.15), 50);
    this.vibrate(50);
  }

  public playTimerPause() {
    this.playTone(800, 'sine', 0.1);
    setTimeout(() => this.playTone(600, 'sine', 0.15), 50);
    this.vibrate(50);
  }

  public playTimerFinished() {
    this.playTone(880, 'sine', 0.2);
    setTimeout(() => this.playTone(880, 'sine', 0.2), 400);
    setTimeout(() => this.playTone(880, 'sine', 0.6), 800);
    this.vibrate([500, 200, 500]);
  }

  // --- Focus Noise ---
  
  public setNoiseType(type: NoiseType) {
    this.currentNoiseType = type;
    if (this.isNoisePlaying) {
      this.toggleFocusNoise(false);
      setTimeout(() => this.toggleFocusNoise(true), 50);
    }
  }

  public toggleFocusNoise(enable: boolean) {
    if (enable && !this.soundEnabled) return;

    this.init();
    if (!this.ctx) return;

    if (enable && !this.isNoisePlaying) {
      const bufferSize = 4096;
      this.noiseNode = this.ctx.createScriptProcessor(bufferSize, 1, 1);
      
      this.noiseNode.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        
        if (this.currentNoiseType === 'white') {
           for (let i = 0; i < bufferSize; i++) {
             output[i] = Math.random() * 2 - 1;
             output[i] *= 0.05;
           }
        } else if (this.currentNoiseType === 'pink') {
           let lastOut = 0;
           for (let i = 0; i < bufferSize; i++) {
             const white = Math.random() * 2 - 1;
             output[i] = (lastOut + (0.02 * white)) / 1.02;
             lastOut = output[i];
             output[i] *= 3.5;
           }
        } else {
           let lastOut = 0;
           for (let i = 0; i < bufferSize; i++) {
             const white = Math.random() * 2 - 1;
             output[i] = (lastOut + (0.02 * white)) / 1.02;
             lastOut = output[i];
             output[i] *= 3.5; 
           }
        }
      };

      this.noiseGain = this.ctx.createGain();
      if (this.currentNoiseType === 'white') this.noiseGain.gain.value = 0.02;
      else if (this.currentNoiseType === 'pink') this.noiseGain.gain.value = 0.04;
      else this.noiseGain.gain.value = 0.06;
      
      this.noiseNode.connect(this.noiseGain);
      this.noiseGain.connect(this.ctx.destination);
      this.isNoisePlaying = true;

    } else if (!enable && this.isNoisePlaying) {
      if (this.noiseNode && this.noiseGain) {
        this.noiseNode.disconnect();
        this.noiseGain.disconnect();
        this.noiseNode = null;
        this.noiseGain = null;
      }
      this.isNoisePlaying = false;
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number) {
    if (!this.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  }
}

export const soundService = new SoundService();