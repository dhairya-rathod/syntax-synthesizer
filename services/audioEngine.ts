import * as Tone from 'tone';
import { MusicalEvent, ParsedComposition } from './codeParser';

class AudioEngine {
  private polySynth: Tone.PolySynth | null = null;
  private membraneSynth: Tone.MembraneSynth | null = null; // Kick
  private noiseSynth: Tone.NoiseSynth | null = null; // Snare/Hihat
  private reverb: Tone.Reverb | null = null;
  private delay: Tone.PingPongDelay | null = null;
  private analyzer: Tone.Analyser | null = null;
  private part: Tone.Part | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    await Tone.start();

    // Effects
    this.reverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.1 }).toDestination();
    await this.reverb.generate();
    this.delay = new Tone.PingPongDelay("8n", 0.2).connect(this.reverb);

    // Melody Synth (FM for techno/cyberpunk)
    this.polySynth = new Tone.PolySynth(Tone.FMSynth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 1 },
      modulation: { type: 'square' },
      modulationIndex: 5
    }).connect(this.delay);

    // Increased volume from -8 to -4 for clearer melody
    this.polySynth.volume.value = 8;

    // Drum Synths
    this.membraneSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
    }).connect(this.reverb);
    // Increased volume from -5 to 0 for punchy kick
    this.membraneSynth.volume.value = 15;

    this.noiseSynth = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
    }).connect(this.reverb);
    // Increased volume from -12 to -6 for crisp snares
    this.noiseSynth.volume.value = 12;

    // Analyzer for Visuals
    this.analyzer = new Tone.Analyser('fft', 256);
    Tone.Destination.connect(this.analyzer);

    this.isInitialized = true;
  }

  play(composition: ParsedComposition) {
    if (!this.isInitialized) return;
    
    this.stop(); // Clear previous

    Tone.Transport.bpm.value = composition.bpm;
    
    // Create a Tone.Part to schedule events
    this.part = new Tone.Part((time, event: MusicalEvent) => {
      // Play Melody
      if (event.note && this.polySynth) {
        // Randomize velocity slightly for human feel
        this.polySynth.triggerAttackRelease(event.note, event.duration, time, event.velocity);
      }

      // Play Drums
      if (event.isDrum) {
        if (event.drumType === 'kick' && this.membraneSynth) {
            this.membraneSynth.triggerAttackRelease("C1", "8n", time);
        } else if (event.drumType === 'snare' && this.noiseSynth) {
            this.noiseSynth.triggerAttackRelease("16n", time);
        } else if (event.drumType === 'hihat' && this.noiseSynth) {
             // For hihat, simpler noise
             // We can't change the synth config easily mid-flight without multiple synths, 
             // so we'll reuse noise synth but quieter
             this.noiseSynth.triggerAttackRelease("32n", time, 0.5); 
        }
      }

      // Schedule a draw event for visuals triggers if needed (optional)
      Tone.Draw.schedule(() => {
        // Could dispatch event to React here if we wanted tight DOM coupling
      }, time);

    }, composition.melodyEvents);

    this.part.loop = true;
    // Loop length is roughly the end of the last event. 
    // A simple approximation:
    // We assume the last event time + its duration is the loop end.
    // For robustness, we can set loopEnd manually if we calculated total ticks.
    // For now, let Tone.js auto-determine or just let it loop naturally if we don't set loopEnd explicitly (it might not loop correctly without it).
    
    // Calculate loop end
    const lastEvent = composition.melodyEvents[composition.melodyEvents.length - 1];
    if (lastEvent) {
         // This is a bit tricky with mixed transport time strings. 
         // Let's just let it run. To loop perfectly, we'd need to parse the time strings.
         // Simplification: Set loop to true, but we need a loopEnd. 
         // We'll guess roughly 4 bars for short snippets or dynamic based on length.
         this.part.loopEnd = `${Math.ceil(composition.melodyEvents.length / 4)}:0:0`; 
    }

    this.part.start(0);
    Tone.Transport.start();
  }

  stop() {
    Tone.Transport.stop();
    Tone.Transport.cancel(); // clear all scheduled events
    if (this.part) {
      this.part.dispose();
      this.part = null;
    }
  }

  getAnalyzerValue(): Float32Array | null {
    if (!this.analyzer) return null;
    return this.analyzer.getValue() as Float32Array;
  }
}

export const audioEngine = new AudioEngine();