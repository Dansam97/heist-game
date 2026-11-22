// Procedural sound for Velvet Vault: everything is synthesised with the
// Web Audio API, so the game ships no sound files at all. The context is
// created lazily on the first user gesture, and M toggles mute.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let humNodes = null;

  function ensure() {
    if (ctx) return ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    return ctx;
  }

  function tone(freq, seconds, type, gainValue, when = 0, slideTo = null) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  function noiseBurst(seconds, gainValue, lowpass) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime;
    const len = Math.max(1, Math.floor(ac.sampleRate * seconds));
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ac.createGain();
    gain.gain.value = gainValue;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start(t0);
  }

  return {
    unlock() {
      const ac = ensure();
      if (ac && ac.state === 'suspended') ac.resume();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    footstep(sneaking) {
      noiseBurst(0.07, sneaking ? 0.05 : 0.11, 700);
    },
    spotted() {
      tone(880, 0.16, 'square', 0.06);
      tone(1174, 0.22, 'square', 0.06, 0.12);
    },
    alarmTick() {
      tone(1567, 0.09, 'sine', 0.05);
    },
    grabTick(progress) {
      tone(520 + progress * 420, 0.06, 'triangle', 0.05);
    },
    pickup() {
      tone(660, 0.12, 'triangle', 0.09);
      tone(880, 0.14, 'triangle', 0.09, 0.09);
      tone(1320, 0.2, 'triangle', 0.08, 0.18);
    },
    smoke() {
      noiseBurst(0.5, 0.16, 1200);
    },
    caught() {
      tone(392, 0.25, 'sawtooth', 0.08);
      tone(311, 0.25, 'sawtooth', 0.08, 0.22);
      tone(233, 0.5, 'sawtooth', 0.09, 0.44);
    },
    escaped() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((n, i) => tone(n, 0.22, 'triangle', 0.09, i * 0.11));
    },
    click() {
      tone(740, 0.05, 'square', 0.04);
    },
    startHum() {
      if (humNodes || muted) return;
      const ac = ensure();
      if (!ac) return;
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 55;
      const gain = ac.createGain();
      gain.gain.value = 0.015;
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      humNodes = { osc, gain };
    },
    stopHum() {
      if (!humNodes) return;
      try {
        humNodes.osc.stop();
      } catch {
        // Already stopped; nothing to do.
      }
      humNodes = null;
    },
  };
}
