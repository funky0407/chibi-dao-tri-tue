import { C } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, button, burst } from '../ui/helpers.js';
import { chibiImage } from '../art/svg.js';
import Save from '../core/SaveManager.js';
import Audio from '../core/AudioManager.js';
import { pick } from '../core/QuestionGenerator.js';
import { starsFromRatio } from '../core/Rewards.js';

const LANES = [
  { key: 'LEFT', rot: -90 },
  { key: 'UP', rot: 0 },
  { key: 'DOWN', rot: 180 },
  { key: 'RIGHT', rot: 90 },
];
// Làn được dùng theo số làn của cấp độ (2 làn: trái/phải, 3 làn: trái/lên/phải).
const ACTIVE = { 2: [0, 3], 3: [0, 1, 3], 4: [0, 1, 2, 3] };
const CENTER_X = 855;
const LANE_GAP = 130;
const TARGET_Y = 600;
const SPAWN_Y = 110;
const PITCH = [523, 587, 659, 784];
const BASS = [131, 98, 110, 87];
const PERFECT = 170;
const OK = 300;
const KID = { x: 320, y: 410, s: 0.85 };

// Nhảy theo nhịp: mũi tên rơi xuống, bé chạm đúng lúc mũi tên chạm vòng tròn.
export default class DanceGame extends BaseMinigame {
  constructor() { super('dance'); }

  create() {
    this.setup({ bg: 'bg_stage' });
    Audio.pauseMusic();
    this.events.once('shutdown', () => Audio.resumeMusic());
    this.titleText.setColor('#ffffff').setStroke('#8a5cd6', 8);
    this.beatMs = 60000 / this.cfg.bpm;
    this.fallMs = this.beatMs * 2.5;
    this.started = false;
    this.points = 0;
    this.lanes = ACTIVE[this.cfg.lanes] || ACTIVE[4];
    this.laneX = {};
    this.lanes.forEach((lane, k) => { this.laneX[lane] = CENTER_X + (k - (this.lanes.length - 1) / 2) * LANE_GAP; });
    this.notes = this.buildNotes();

    const g = this.add.graphics();
    this.pads = {};
    this.lanes.forEach((i) => {
      const x = this.laneX[i];
      g.fillStyle(0xffffff, 0.08).fillRoundedRect(x - 56, 96, 112, 570, 34);
      this.pads[i] = this.add.circle(x, TARGET_Y, 52).setStrokeStyle(6, 0xffffff, 0.9);
      this.add.image(x, TARGET_Y, `note_${i}`).setScale(0.8).setAngle(LANES[i].rot).setAlpha(0.3);
      const zone = this.add.zone(x, 560, 126, 320).setInteractive();
      zone.on('pointerdown', () => this.hit(i));
      this.input.keyboard.on(`keydown-${LANES[i].key}`, () => this.hit(i));
    });

    this.kid = chibiImage(this, KID.x, KID.y, Save.player, 'happy').setScale(KID.s);
    this.judge = text(this, CENTER_X, 330, '', 56, '#ffffff', { stroke: '#8a5cd6', strokeThickness: 10 }).setDepth(50);
    this.scoreText = text(this, KID.x, 140, '', 36, '#ffffff', { stroke: '#8a5cd6', strokeThickness: 8 });

    this.startBtn = button(this, CENTER_X, 360, 320, 100, 'Bắt đầu!', C.pink, () => this.begin());
    this.startBtn.setDepth(60);
    this.mascot.say('Khi mũi tên chạm vòng tròn, bé chạm vào đó nhé!', { duration: 0 });
  }

  // Phần chậm (2 phách/nốt), phần nhanh (1 phách/nốt), phần siêu nhanh (nửa phách/nốt).
  buildNotes() {
    const notes = [];
    let beat = 4, prev = -1, same = 0;
    const lane = () => {
      let l;
      do { l = pick(this.lanes); } while (l === prev && same >= 1);
      same = l === prev ? same + 1 : 0;
      prev = l;
      return l;
    };
    const section = (count, step) => {
      for (let k = 0; k < count; k++) { notes.push({ lane: lane(), beat }); beat += step; }
    };
    section(this.cfg.slow, 2);
    section(this.cfg.fast, 1);
    section(this.cfg.rapid || 0, 0.5);
    this.endBeat = Math.ceil(beat) + 2;
    return notes;
  }

  begin() {
    this.startBtn.destroy();
    this.mascot.hide();
    this.started = true;
    this.t0 = this.time.now + 300;
    this.half = 0;
    this.time.delayedCall(300, () => {
      this.onHalfBeat();
      this.clock = this.time.addEvent({ delay: this.beatMs / 2, loop: true, callback: () => this.onHalfBeat() });
    });
  }

  onHalfBeat() {
    const h = this.half++;
    if (h % 2) { Audio.hat(); return; }
    const beat = h / 2;
    Audio.kick();
    if (beat % 2 === 0) Audio.bass(BASS[Math.floor(beat / 4) % BASS.length]);
    if (beat < 4) this.flash(['3', '2', '1', 'Nhảy!'][beat], '#ffd166');
    if (beat >= this.endBeat) this.end();
  }

  timeOf(n) { return this.t0 + n.beat * this.beatMs; }

  update() {
    if (!this.started) return;
    const now = this.time.now;
    for (const n of this.notes) {
      const t = this.timeOf(n);
      if (!n.obj && !n.done && now >= t - this.fallMs) {
        n.obj = this.add.image(this.laneX[n.lane], SPAWN_Y, `note_${n.lane}`).setScale(0.85).setAngle(LANES[n.lane].rot).setDepth(20);
      }
      if (n.obj && !n.done) {
        n.obj.y = SPAWN_Y + (TARGET_Y - SPAWN_Y) * (1 - (t - now) / this.fallMs);
        if (now - t > OK) this.miss(n);
      }
    }
  }

  hit(lane) {
    this.tweens.add({ targets: this.pads[lane], scale: 1.15, duration: 80, yoyo: true });
    if (!this.started) return;
    const now = this.time.now;
    let best = null, bestDt = Infinity;
    for (const n of this.notes) {
      if (n.lane !== lane || n.done || !n.obj) continue;
      const dt = Math.abs(now - this.timeOf(n));
      if (dt < bestDt) { best = n; bestDt = dt; }
    }
    if (!best || bestDt > OK) return;
    best.done = true;
    const perfect = bestDt <= PERFECT;
    this.points += perfect ? 2 : 1;
    this.good(undefined, undefined, { sound: false });
    Audio.tone(PITCH[lane], 0.22, { type: 'triangle', vol: 0.2 });
    this.flash(perfect ? 'Tuyệt!' : 'Tốt!', perfect ? '#ffd166' : '#8ee3c8');
    burst(this, this.laneX[lane], TARGET_Y, 10);
    const obj = best.obj;
    this.tweens.add({ targets: obj, scale: 1.3, alpha: 0, duration: 200, onComplete: () => obj.destroy() });
    this.dance(lane);
    this.scoreText.setText(`Điểm: ${this.points}`);
  }

  // Trượt nhịp không tính là "trả lời sai" nên không gọi chú cún, tránh cún chạy liên tục.
  miss(n) {
    n.done = true;
    const obj = n.obj;
    this.tweens.add({ targets: obj, alpha: 0, y: obj.y + 40, duration: 250, onComplete: () => obj.destroy() });
    this.flash('Trượt', '#d9cfe0');
    this.bad(null, { sound: false, dog: false });
  }

  dance(lane) {
    const k = this.kid;
    this.tweens.killTweensOf(k);
    k.setPosition(KID.x, KID.y).setAngle(0).setScale(KID.s);
    if (lane === 0) this.tweens.add({ targets: k, x: KID.x - 30, angle: -12, duration: 120, yoyo: true });
    else if (lane === 3) this.tweens.add({ targets: k, x: KID.x + 30, angle: 12, duration: 120, yoyo: true });
    else if (lane === 1) this.tweens.add({ targets: k, y: KID.y - 50, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
    else this.tweens.add({ targets: k, scaleY: KID.s * 0.82, scaleX: KID.s * 1.08, duration: 120, yoyo: true });
  }

  flash(str, color) {
    this.tweens.killTweensOf(this.judge);
    this.judge.setText(str).setColor(color).setScale(0.6).setAlpha(1);
    this.tweens.add({ targets: this.judge, scale: 1, duration: 150, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.judge, alpha: 0, delay: 450, duration: 200 });
  }

  end() {
    if (!this.started) return;
    this.started = false;
    this.clock.remove();
    const ratio = this.points / (this.notes.length * 2);
    this.flash('Hoàn thành!', '#ffd166');
    this.finish(starsFromRatio(ratio, 0.75, 0.45));
  }
}
