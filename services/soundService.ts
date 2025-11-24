
// Simple Audio Service using synthesized sounds or small base64 urls would be ideal, 
// but for this implementation we will use a silent failure approach if files aren't found, 
// or simple oscillator beeps for a purely frontend solution without external assets.
// To make it feel premium, we will use Web Audio API oscillators which require no external files.

class SoundService {
  private ctx: AudioContext | null = null;
  private volume: number = 0.15;
  
  // Focus Noise State
  private noiseNode: ScriptProcessorNode | null = null;
  private noiseGain: GainNode | null = null;
  private isNoisePlaying: boolean = false;

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
  }

  // --- Haptic Feedback ---
  
  public vibrate(pattern: number | number[]) {
    if (!this.hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  // --- Sound Effects ---

  // A subtle "click" or "tick" sound
  public playClick() {
    this.playTone(800, 'sine', 0.05);
    this.vibrate(10); // Light tap
  }

  // A satisfying "pop" when marking a habit
  public playComplete() {
    this.playTone(1200, 'triangle', 0.1);
    setTimeout(() => this.playTone(1800, 'sine', 0.1), 50);
    this.vibrate([15, 30, 15]); // Double tap
  }

  // A "success" chord when finishing a day
  public playSuccess() {
    this.playTone(440, 'sine', 0.3); // A4
    setTimeout(() => this.playTone(554, 'sine', 0.3), 100); // C#5
    setTimeout(() => this.playTone(659, 'sine', 0.4), 200); // E5
    this.vibrate([50, 50, 50, 50, 100]); // Celebration pattern
  }

  // A "failure" or "error" sound
  public playError() {
    this.playTone(150, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(100, 'sawtooth', 0.2), 100);
    this.vibrate([100, 50, 100]); // Error buzz
  }

  // A level up sound (Ascending arpeggio)
  public playLevelUp() {
    this.playTone(523.25, 'square', 0.1); // C5
    setTimeout(() => this.playTone(659.25, 'square', 0.1), 100); // E5
    setTimeout(() => this.playTone(783.99, 'square', 0.1), 200); // G5
    setTimeout(() => this.playTone(1046.50, 'square', 0.4), 300); // C6
    this.vibrate([30, 30, 30, 30, 200]);
  }

  // Timer Specific Sounds
  public playTimerStart() {
    // Rising futuristic blip
    this.playTone(600, 'sine', 0.1);
    setTimeout(() => this.playTone(800, 'sine', 0.15), 50);
    this.vibrate(50);
  }

  public playTimerPause() {
    // Falling blip
    this.playTone(800, 'sine', 0.1);
    setTimeout(() => this.playTone(600, 'sine', 0.15), 50);
    this.vibrate(50);
  }

  public playTimerFinished() {
    // Gentle alarm sequence
    const now = this.ctx?.currentTime || 0;
    this.playTone(880, 'sine', 0.2); // A5
    setTimeout(() => this.playTone(880, 'sine', 0.2), 400);
    setTimeout(() => this.playTone(880, 'sine', 0.6), 800);
    this.vibrate([500, 200, 500]); // Long buzz
  }

  // --- Focus Noise (Brown Noise) ---
  // Brown noise is deeper and better for reading/focus than white noise
  public toggleFocusNoise(enable: boolean) {
    if (enable && !this.soundEnabled) return;

    this.init();
    if (!this.ctx) return;

    if (enable && !this.isNoisePlaying) {
      const bufferSize = 4096;
      this.noiseNode = this.ctx.createScriptProcessor(bufferSize, 1, 1);
      
      this.noiseNode.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Brown noise filter: Integrate white noise
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          // Compensate gain
          output[i] *= 3.5; 
        }
      };

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.value = 0.05; // Very subtle background rumble
      
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

  // Private helper to generate tones
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
      // Audio context might be blocked or failed
      console.error("Audio playback failed", e);
    }
  }
}

export const soundService = new SoundService();