// A D-Minor Dorian / Cyberpunk scale
export const SCALES = {
    DORIAN: ["D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "A4", "C5"],
    PENTATONIC: ["C3", "Eb3", "F3", "G3", "Bb3", "C4", "Eb4", "F4", "G4"],
};

export const DEFAULT_CODE = `function generateRhythm(input) {
  const base = 10;
  // Loop determines BPM
  for (let i = 0; i < base; i++) {
    if (i % 2 === 0) {
      console.log("Kick");
      nestedFunction(i);
    } else {
      console.log("Snare");
    }
  }
}

function nestedFunction(val) {
    if (val > 5) {
        // Deeper indent = Higher pitch
        return true;
    }
    return false;
}`;
