// Native Web Audio API sound synthesizer for chess move sound effects.
// ponytail: synthesize audio natively using AudioContext to avoid downloading 3rd party audio assets.

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playMoveSound(moveObj = null, soundEnabled = true, soundVolume = 0.8, soundTheme = 'classic') {
  if (!soundEnabled || soundVolume <= 0) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    const vol = Math.max(0, Math.min(1, soundVolume));
    masterGain.gain.setValueAtTime(vol, now);
    masterGain.connect(ctx.destination);

    const san = moveObj?.san || moveObj?.move || '';
    const cls = (moveObj?.classification || '').toLowerCase();

    const isCapture = san.includes('x');
    const isCheckmate = san.includes('#');
    const isCheck = san.includes('+');
    const isCastle = san.startsWith('O-O');
    const isPromotion = san.includes('=');
    const isBlunder = cls === 'blunder' || cls === 'mistake';

    // Theme frequency multipliers: classic = 1.0, soft = 0.85 (mellow), arcade = 1.25 (higher pitch/bright)
    const freqMult = soundTheme === 'soft' ? 0.85 : soundTheme === 'arcade' ? 1.25 : 1.0;

    if (isCheckmate) {
      // Victory Chord (C Major triad)
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = soundTheme === 'arcade' ? 'square' : 'triangle';
        osc.frequency.setValueAtTime(freq * freqMult, now + idx * 0.05);
        gain.gain.setValueAtTime(0.15, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.4);
      });
    } else if (isCheck) {
      // High alert chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750 * freqMult, now);
      osc.frequency.exponentialRampToValueAtTime(950 * freqMult, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (isCapture) {
      // Wooden impact (dual thud)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = soundTheme === 'arcade' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(320 * freqMult, now);
      osc.frequency.exponentialRampToValueAtTime(80 * freqMult, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (isCastle) {
      // Double tap slide click
      [0, 0.06].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400 * freqMult, now + delay);
        osc.frequency.exponentialRampToValueAtTime(200 * freqMult, now + delay + 0.05);
        gain.gain.setValueAtTime(0.18, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.05);
      });
    } else if (isPromotion) {
      // Rising sparkle
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 * freqMult, now);
      osc.frequency.exponentialRampToValueAtTime(880 * freqMult, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (isBlunder) {
      // Warning low pitch thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = soundTheme === 'arcade' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(220 * freqMult, now);
      osc.frequency.exponentialRampToValueAtTime(100 * freqMult, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.12);
    } else {
      // Standard move click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520 * freqMult, now);
      osc.frequency.exponentialRampToValueAtTime(160 * freqMult, now + 0.07);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.07);
    }
  } catch (e) {
    void e;
  }
}
