/* Short synthesized UI sounds (Web Audio, no audio files) and the on/off preference. */

const SOUND_KEY = 'sudokuweb-sound';
let audioContext = null;

function isSoundOn() {
  try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch (e) { return true; }
}

function setSoundOn(on) {
  try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (e) { /* ignore */ }
}

/* notes: [frequencyHz, startSeconds, durationSeconds][] */
function playNotes(notes, type = 'sine', volume = 0.08) {
  if (!isSoundOn()) return;
  const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    audioContext = audioContext || new AudioCtx();
    if (audioContext.state === 'suspended') audioContext.resume();
    const now = audioContext.currentTime;
    for (const [frequency, start, duration] of notes) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, now + start);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(now + start);
      osc.stop(now + start + duration);
    }
  } catch (e) { /* audio unavailable */ }
}

const Sound = {
  digit: () => playNotes([[660, 0, 0.05]]),
  conflict: () => playNotes([[180, 0, 0.16]], 'triangle', 0.12),
  hint: () => playNotes([[880, 0, 0.07], [1320, 0.07, 0.1]]),
  win: () => playNotes([[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.24]]),
};
