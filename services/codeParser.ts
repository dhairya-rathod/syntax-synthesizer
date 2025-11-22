import { SCALES } from '../constants';

export interface MusicalEvent {
  time: string;
  note: string | null; // Null for silence/percussion only lines
  duration: string;
  isDrum: boolean;
  drumType?: 'kick' | 'snare' | 'hihat';
  velocity: number;
}

export interface ParsedComposition {
  bpm: number;
  melodyEvents: MusicalEvent[];
}

export const parseCodeToMusic = (code: string, scaleKey: keyof typeof SCALES = 'DORIAN'): ParsedComposition => {
  const lines = code.split('\n');
  
  // 1. Calculate BPM
  // Base BPM 90. Add 10 for every loop structure found.
  const loopKeywords = ['for', 'while', 'map', 'forEach', 'reduce'];
  let loopCount = 0;
  loopKeywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'g');
    const matches = code.match(regex);
    if (matches) loopCount += matches.length;
  });
  
  const bpm = Math.min(Math.max(80, 90 + (loopCount * 15)), 180);

  // 2. Generate Events
  const events: MusicalEvent[] = [];
  const scale = SCALES[scaleKey];
  
  // We track a virtual "transport time" in 16th notes
  let currentTime16ths = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) return; // Skip empty or pure comments

    // Indentation Depth -> Pitch
    // Find number of leading spaces
    const leadingSpaces = line.search(/\S|$/);
    // Assume 2 spaces = 1 indentation level
    const depth = Math.floor(leadingSpaces / 2);
    const noteIndex = Math.min(depth, scale.length - 1);
    const note = scale[noteIndex];

    // Line Length -> Duration
    // Short lines (< 10 chars) -> 16n
    // Medium lines (< 25 chars) -> 8n
    // Long lines -> 4n
    let durationStr = '16n';
    let stepIncrement = 1; // How many 16th notes to advance

    if (trimmed.length > 30) {
        durationStr = '4n';
        stepIncrement = 4;
    } else if (trimmed.length > 15) {
        durationStr = '8n';
        stepIncrement = 2;
    } else {
        durationStr = '16n';
        stepIncrement = 1;
    }

    // Keywords -> Drums / Special Effects
    const isIf = trimmed.startsWith('if');
    const isElse = trimmed.startsWith('else');
    const isReturn = trimmed.startsWith('return');
    const isFunction = trimmed.includes('function');

    let drumType: 'kick' | 'snare' | 'hihat' | undefined = undefined;
    let isDrum = false;

    if (isIf) {
        isDrum = true;
        drumType = 'kick';
    } else if (isElse) {
        isDrum = true;
        drumType = 'snare';
    } else if (isFunction) {
        isDrum = true;
        drumType = 'hihat'; // Open hihat feel
    }

    // Convert accumulated 16ths to "Bars:Beats:Sixteenths" roughly
    // Or easier: Tone.js allows "0:0:0" format.
    // We will construct a time string "0:${Math.floor(currentTime16ths / 4)}:${currentTime16ths % 4}"
    // However, for a sequence, we might just return the raw objects and let Tone.Sequence handle the timing 
    // if we used a fixed grid. But since duration varies, we need absolute scheduling or a recursive loop.
    
    // To simplify for Tone.Part or simple scheduling, we'll convert 16ths to a transport notation.
    const bars = Math.floor(currentTime16ths / 16);
    const quarters = Math.floor((currentTime16ths % 16) / 4);
    const sixteenths = currentTime16ths % 4;
    const timeStamp = `${bars}:${quarters}:${sixteenths}`;

    events.push({
      time: timeStamp,
      note: isDrum && !isReturn ? null : note, // If it's purely a logic branch (if/else), maybe no melody? Let's layer them.
      duration: durationStr,
      isDrum,
      drumType,
      velocity: 0.6 + (depth * 0.1), // Deeper indentation = Louder
    });

    // If it's a return statement, add a pause (rest)
    if (isReturn) {
        currentTime16ths += stepIncrement * 2;
    } else {
        currentTime16ths += stepIncrement;
    }
  });

  return { bpm, melodyEvents: events };
};