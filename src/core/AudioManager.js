// Âm thanh tổng hợp bằng Web Audio (không cần file) + giọng đọc bằng Web Speech.
// Hiệu ứng (enabled) và nhạc nền (musicOn) bật/tắt riêng.

// Nhạc nền: vòng hợp âm C - Am - F - G, giai điệu ngũ cung nhẹ nhàng, mỗi ô là một móc đơn (0 = nghỉ).
const MUSIC_BPM = 84;
const CHORDS = [
  [261.6, 329.6, 392.0],
  [220.0, 261.6, 329.6],
  [174.6, 220.0, 261.6],
  [196.0, 246.9, 293.7],
];
const MELODY = [
  [523, 0, 659, 0, 784, 0, 659, 0],
  [880, 0, 784, 0, 659, 0, 0, 0],
  [659, 0, 587, 0, 523, 0, 587, 0],
  [587, 0, 0, 0, 659, 0, 0, 0],
  [784, 0, 659, 0, 523, 0, 659, 0],
  [659, 0, 523, 0, 440, 0, 0, 0],
  [523, 0, 587, 0, 659, 0, 523, 0],
  [587, 0, 494, 0, 523, 0, 0, 0],
];

class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicOn = true;
    this.musicPaused = false;
    this.musicTimer = null;
    this.voice = true;
    this.voices = [];
    if (window.speechSynthesis) {
      const load = () => { this.voices = speechSynthesis.getVoices(); };
      load();
      speechSynthesis.onvoiceschanged = load;
    }
  }

  init(settings) {
    this.enabled = settings.sound !== false;
    this.musicOn = settings.music !== false;
    this.voice = settings.voice !== false;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.musicOn && !this.musicPaused) this.startMusic();
  }

  play(freq, t, dur, { type = 'sine', vol = 0.18, slide = 0, attack = 0.012 } = {}, dest) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest || ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  tone(freq, dur = 0.15, { delay = 0, ...opts } = {}) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx) return;
    this.play(freq, this.ctx.currentTime + delay, dur, opts);
  }

  noise(dur = 0.04, vol = 0.05, delay = 0) {
    if (!this.enabled) return;
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return;
    if (!this.noiseBuf) {
      const len = Math.floor(ctx.sampleRate * 0.2);
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + delay;
    const s = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    s.buffer = this.noiseBuf;
    f.type = 'highpass';
    f.frequency.value = 6000;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(ctx.destination);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  click() { this.tone(700, 0.07, { type: 'triangle', vol: 0.12 }); }
  pop() { this.tone(420, 0.1, { slide: 2.2, vol: 0.18 }); }
  correct() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.16, { type: 'triangle', delay: i * 0.07 })); }
  wrong() { this.tone(330, 0.28, { slide: 0.55, vol: 0.2 }); }
  star(i = 0) { this.tone(784 * Math.pow(1.26, i), 0.3, { type: 'triangle', vol: 0.2 }); }
  win() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
      this.tone(f, i === 5 ? 0.5 : 0.14, { type: 'triangle', delay: i * 0.11, vol: 0.16 }));
  }
  kick() { this.tone(140, 0.2, { slide: 0.35, vol: 0.45 }); }
  hat() { this.noise(0.04, 0.05); }
  bass(f) { this.tone(f, 0.3, { type: 'triangle', vol: 0.14 }); }
  // Tiếng cười "ha ha ha" của chú cún.
  giggle() {
    [760, 640, 760, 620, 740, 600].forEach((f, i) =>
      this.tone(f, 0.09, { type: 'triangle', vol: 0.13, delay: i * 0.12, slide: 0.75 }));
  }

  // ---------- Nhạc nền ----------

  startMusic() {
    if (this.musicTimer || !this.ctx || !this.musicOn || this.musicPaused) return;
    const ctx = this.ctx;
    if (!this.musicBus) {
      this.musicBus = ctx.createGain();
      this.musicBus.connect(ctx.destination);
    }
    const g = this.musicBus.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(0.0001, ctx.currentTime);
    g.exponentialRampToValueAtTime(0.6, ctx.currentTime + 1.5);
    this.nextNote = ctx.currentTime + 0.1;
    this.step = 0;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 100);
    this.scheduleMusic();
  }

  stopMusic() {
    if (!this.musicTimer) return;
    clearInterval(this.musicTimer);
    this.musicTimer = null;
    const ctx = this.ctx;
    const g = this.musicBus.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(Math.max(0.0001, g.value), ctx.currentTime);
    g.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
  }

  // Lên lịch trước các nốt sắp tới để nhạc không bị giật khi trang bận.
  scheduleMusic() {
    const ctx = this.ctx;
    const eighth = 60 / MUSIC_BPM / 2;
    while (this.nextNote < ctx.currentTime + 0.5) {
      const s = this.step;
      const bar = Math.floor(s / 8);
      const e = s % 8;
      const chord = CHORDS[bar % CHORDS.length];
      const t = this.nextNote;
      if (e === 0) chord.forEach((f) => this.play(f, t, eighth * 8, { vol: 0.03, attack: 0.5 }, this.musicBus));
      if (e === 0 || e === 4) this.play(chord[0] / 2, t, eighth * 3.5, { type: 'triangle', vol: 0.07, attack: 0.03 }, this.musicBus);
      const m = MELODY[bar % MELODY.length][e];
      if (m) this.play(m, t, eighth * 1.8, { type: 'triangle', vol: 0.05, attack: 0.02 }, this.musicBus);
      this.nextNote += eighth;
      this.step++;
    }
  }

  setMusic(on) {
    this.musicOn = on;
    if (on) this.unlock();
    else this.stopMusic();
  }

  pauseMusic() {
    this.musicPaused = true;
    this.stopMusic();
  }

  resumeMusic() {
    this.musicPaused = false;
    if (this.ctx) this.startMusic();
  }

  // Chỉ đọc khi máy có giọng đúng ngôn ngữ, tránh đọc tiếng Việt bằng giọng tiếng Anh.
  speak(str, lang = 'vi-VN') {
    if (!this.voice || !window.speechSynthesis || !str) return;
    const want = lang.toLowerCase();
    const norm = (v) => v.lang.toLowerCase().replace('_', '-');
    const v = this.voices.find((x) => norm(x) === want) || this.voices.find((x) => norm(x).startsWith(want.slice(0, 2)));
    if (!v) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(str);
    u.voice = v;
    u.lang = v.lang;
    u.rate = 0.95;
    u.pitch = 1.15;
    speechSynthesis.speak(u);
  }
}

export default new AudioManager();
