import { getSupermarketFeedbackEnabled } from "./appPreferences";

let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (
        window.AudioContext || window.webkitAudioContext
      )();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

/** Classic supermarket scanner beep (short square wave). */
export function playBarcodeScanSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1318, t);
  osc.frequency.exponentialRampToValueAtTime(1046, t + 0.05);
  gain.gain.setValueAtTime(0.14, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

/** Short pleasant "tick" via Web Audio (no asset file). */
export function playCheckSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(440, t + 0.06);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

/** Stronger pattern when the whole list is done. */
export function playListCompleteSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.09;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  });
}

/** @param {number | number[]} pattern ms */
export function hapticPulse(pattern = 12) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/** Beep + light haptic when a barcode is read. */
export function fireBarcodeScanFeedback() {
  if (!getSupermarketFeedbackEnabled()) return;
  playBarcodeScanSound();
  hapticPulse(8);
}

/**
 * Feedback when checking off an item in supermarket mode.
 * @param {{ listJustCompleted?: boolean }} [opts]
 */
export function fireSupermarketCheckFeedback(opts = {}) {
  if (!getSupermarketFeedbackEnabled()) return;
  if (opts.listJustCompleted) {
    playListCompleteSound();
    hapticPulse([20, 40, 20, 40, 30]);
  } else {
    playCheckSound();
    hapticPulse(12);
  }
}
