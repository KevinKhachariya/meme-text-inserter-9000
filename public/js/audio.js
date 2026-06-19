/**
 * Audio feedback — mechanical keyboard click sounds.
 * Uses Web Audio API oscillators only — no audio files, no copyright concerns.
 */
import { state } from './state.js';

export function tickSound(type = 'click') {
  if (!state.soundEnabled) return;
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(type === 'success' ? 0.05 : 0.035, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (type === 'success' ? 0.12 : 0.045));

  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(type === 'key' ? 1800 : type === 'success' ? 880 : 1350, now);
  if (type === 'success') osc.frequency.exponentialRampToValueAtTime(1320, now + 0.09);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + (type === 'success' ? 0.12 : 0.045));

  if (type !== 'success') {
    const low = ctx.createOscillator();
    const lowGain = ctx.createGain();
    low.type = 'triangle';
    low.frequency.setValueAtTime(115, now);
    lowGain.gain.setValueAtTime(0.025, now);
    lowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    low.connect(lowGain).connect(ctx.destination);
    low.start(now);
    low.stop(now + 0.035);
  }
}

function audio() {
  if (!state.soundEnabled) return null;
  state.audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
  return state.audioCtx;
}
