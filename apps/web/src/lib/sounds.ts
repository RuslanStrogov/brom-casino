/**
 * Sound effects utility for casino games.
 * Uses Web Audio API to generate sounds programmatically (no external files needed).
 */

type SoundType = 'spin' | 'win' | 'bigWin' | 'bet' | 'click' | 'lose' | 'jackpot' | 'cardDeal' | 'coinDrop' | 'crash';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

interface Note {
  freq: number;
  dur: number;
  delay: number;
  type?: OscillatorType;
  vol?: number;
}

function playSequence(notes: Note[], baseVolume: number) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;
  notes.forEach(({ freq, dur, delay, type = 'sine', vol }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + delay);
    const volume = vol !== undefined ? vol : baseVolume;
    gain.gain.setValueAtTime(0, now + delay);
    gain.gain.linearRampToValueAtTime(volume, now + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + delay + dur);
    osc.start(now + delay);
    osc.stop(now + delay + dur);
  });
}

export function playSound(sound: SoundType, volume: number = 0.3) {
  const ctx = getAudioContext();
  if (!ctx) return;

  switch (sound) {
    case 'spin':
      playSequence([
        { freq: 200, dur: 0.1, delay: 0, type: 'square', vol: volume * 0.3 },
        { freq: 250, dur: 0.1, delay: 0.05, type: 'square', vol: volume * 0.3 },
        { freq: 300, dur: 0.1, delay: 0.1, type: 'square', vol: volume * 0.3 },
        { freq: 350, dur: 0.1, delay: 0.15, type: 'square', vol: volume * 0.3 },
        { freq: 400, dur: 0.2, delay: 0.2, type: 'square', vol: volume * 0.3 },
      ], volume);
      break;

    case 'win':
      playSequence([
        { freq: 523, dur: 0.15, delay: 0, type: 'sine' },
        { freq: 659, dur: 0.15, delay: 0.1, type: 'sine' },
        { freq: 784, dur: 0.15, delay: 0.2, type: 'sine' },
        { freq: 1047, dur: 0.3, delay: 0.3, type: 'sine' },
      ], volume);
      break;

    case 'bigWin':
      playSequence([
        { freq: 523, dur: 0.15, delay: 0, type: 'sine' },
        { freq: 659, dur: 0.15, delay: 0.12, type: 'sine' },
        { freq: 784, dur: 0.15, delay: 0.24, type: 'sine' },
        { freq: 1047, dur: 0.2, delay: 0.36, type: 'sine' },
        { freq: 1319, dur: 0.2, delay: 0.48, type: 'sine' },
        { freq: 1568, dur: 0.4, delay: 0.6, type: 'sine' },
      ], volume);
      break;

    case 'bet':
      playTone(800, 0.05, 'square', volume * 0.5);
      break;

    case 'click':
      playTone(1000, 0.03, 'sine', volume * 0.3);
      break;

    case 'lose':
      playSequence([
        { freq: 400, dur: 0.2, delay: 0, type: 'sine', vol: volume * 0.5 },
        { freq: 350, dur: 0.2, delay: 0.15, type: 'sine', vol: volume * 0.5 },
        { freq: 300, dur: 0.3, delay: 0.3, type: 'sine', vol: volume * 0.5 },
      ], volume);
      break;

    case 'jackpot':
      playSequence([
        { freq: 523, dur: 0.1, delay: 0, type: 'sine' },
        { freq: 659, dur: 0.1, delay: 0.08, type: 'sine' },
        { freq: 784, dur: 0.1, delay: 0.16, type: 'sine' },
        { freq: 1047, dur: 0.1, delay: 0.24, type: 'sine' },
        { freq: 1319, dur: 0.1, delay: 0.32, type: 'sine' },
        { freq: 1568, dur: 0.1, delay: 0.4, type: 'sine' },
        { freq: 2093, dur: 0.3, delay: 0.48, type: 'sine' },
        { freq: 1047, dur: 0.1, delay: 0.56, type: 'sine', vol: volume * 0.5 },
        { freq: 1319, dur: 0.1, delay: 0.64, type: 'sine', vol: volume * 0.5 },
        { freq: 1568, dur: 0.1, delay: 0.72, type: 'sine', vol: volume * 0.5 },
        { freq: 2093, dur: 0.5, delay: 0.8, type: 'sine' },
      ], volume);
      break;

    case 'cardDeal':
      playSequence([
        { freq: 1200, dur: 0.04, delay: 0, type: 'square', vol: volume * 0.4 },
        { freq: 800, dur: 0.03, delay: 0.02, type: 'square', vol: volume * 0.2 },
      ], volume);
      break;

    case 'coinDrop':
      playSequence([
        { freq: 2000, dur: 0.05, delay: 0, type: 'sine', vol: volume * 0.6 },
        { freq: 3000, dur: 0.03, delay: 0.02, type: 'sine', vol: volume * 0.4 },
        { freq: 2500, dur: 0.04, delay: 0.04, type: 'sine', vol: volume * 0.3 },
      ], volume);
      break;

    case 'crash':
      playSequence([
        { freq: 800, dur: 0.1, delay: 0, type: 'sawtooth', vol: volume * 0.4 },
        { freq: 600, dur: 0.1, delay: 0.05, type: 'sawtooth', vol: volume * 0.3 },
        { freq: 400, dur: 0.1, delay: 0.1, type: 'sawtooth', vol: volume * 0.25 },
        { freq: 200, dur: 0.3, delay: 0.15, type: 'sawtooth', vol: volume * 0.2 },
      ], volume);
      break;
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('soundEnabled') !== 'false';
}

export function toggleSound(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('soundEnabled', String(enabled));
}

export function playSoundIfEnabled(sound: SoundType, volume?: number) {
  if (isSoundEnabled()) {
    playSound(sound, volume);
  }
}
