let ctx: AudioContext | null = null;

/** Call from a tap so the browser lets us play the end-of-play chime later. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

/** A soft three-note chime: gentle rather than alarming. */
export function chime() {
  unlockAudio();
  const ac = ctx;
  if (!ac) return;
  [659.25, 783.99, 1046.5].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const t = ac.currentTime + i * 0.28;
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 1.2);
  });
}
