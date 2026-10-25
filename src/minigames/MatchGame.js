import { W, C } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, choiceCard, shake } from '../ui/helpers.js';
import Audio from '../core/AudioManager.js';
import { shuffle } from '../core/QuestionGenerator.js';

// Chạm một hình rồi chạm một từ tiếng Anh (hoặc ngược lại) để nối.
export default class MatchGame extends BaseMinigame {
  constructor() { super('match'); }

  create() {
    this.setup();
    this.i = 0;
    this.n = this.cfg.sets;
    // Rút từ vựng lần lượt từ một bộ đã trộn để các lượt ít bị lặp từ.
    this.bag = [];
    this.nextRound();
  }

  drawSet() {
    const from = this.cfg.vocabFrom ?? 0;
    const vocab = this.cfg.vocab.slice(from, from + (this.cfg.vocabSize ?? this.cfg.vocab.length));
    const set = [];
    while (set.length < this.cfg.pairs) {
      if (!this.bag.length) this.bag = shuffle(vocab.slice());
      const w = this.bag.pop();
      if (!set.includes(w)) set.push(w);
    }
    return set;
  }

  nextRound() {
    if (this.i >= this.n) return this.finish();
    this.setProgress(this.i, this.n);
    if (this.L) this.L.destroy();
    const L = (this.L = this.add.container(0, 0));
    const set = this.drawSet();
    this.sel = null;
    this.matched = 0;
    this.total = set.length;
    this.lines = this.add.graphics();
    L.add(this.lines);
    // cfg.prompt dùng khi nối tiếng Việt (từ trái nghĩa, tục ngữ...) thay vì tiếng Anh.
    L.add(text(this, W / 2 + 60, 112, this.cfg.prompt || 'Nối hình với từ tiếng Anh', 36, '#8a5cd6'));
    this.mascot.say(this.cfg.prompt
      ? `${this.cfg.prompt}. Bé chạm một ô bên trái rồi chạm ô bên phải nhé!`
      : 'Bé chạm vào hình, rồi chạm vào từ tiếng Anh đúng nhé!', { duration: 3500 });

    const n = set.length;
    const step = n >= 5 ? 96 : 115;
    const y0 = n >= 5 ? 180 : 190 + (4 - n) * step / 2;
    const ch = n >= 5 ? 86 : 104;
    // Ô bên trái rộng ra khi là chữ dài.
    this.lw = set.some((p) => p.label && p.label.length > 4) ? 230 : 150;
    shuffle(set.slice()).forEach((p, k) => {
      // Bên trái là hình, chữ (label) hoặc ô màu (color).
      const len = p.label ? p.label.length : 0;
      const c = choiceCard(this, 440, y0 + k * step, this.lw, ch, {
        image: p.item, label: p.label, size: len > 10 ? 22 : len > 4 ? 28 : 56, color: C.sky, imageSize: ch - 18,
      });
      if (p.color) c.add(this.add.circle(0, 0, ch * 0.32, Phaser.Display.Color.HexStringToColor(p.color).color).setStrokeStyle(4, 0x5b3a5e));
      Object.assign(c, { side: 'L', key: p.word });
      c.on('pointerdown', () => this.tap(c));
      L.add(c);
    });
    shuffle(set.slice()).forEach((p, k) => {
      const wl = p.word.length;
      const c = choiceCard(this, 880, y0 + k * step, 280, ch - 10, { label: p.word, color: C.purple, size: wl > 12 ? 24 : wl > 7 ? 34 : 48 });
      Object.assign(c, { side: 'R', key: p.word });
      c.on('pointerdown', () => this.tap(c));
      L.add(c);
    });
  }

  tap(card) {
    if (card.done || this.locked) return;
    if (card.side === 'R' && !this.cfg.noSpeak) Audio.speak(card.key, this.cfg.lang || 'en-US');
    if (!this.sel || this.sel.side === card.side) {
      if (this.sel) this.sel.mark('normal');
      this.sel = card;
      card.mark('selected');
      Audio.pop();
      return;
    }
    const a = this.sel;
    this.sel = null;
    if (a.key === card.key) {
      a.done = card.done = true;
      a.mark('right');
      card.mark('right');
      const [l, r] = a.side === 'L' ? [a, card] : [card, a];
      const lx = l.x + this.lw / 2;
      this.lines.lineStyle(8, C.mint, 1).lineBetween(lx, l.y, r.x - 140, r.y);
      this.lines.fillStyle(C.mint, 1).fillCircle(lx, l.y, 9).fillCircle(r.x - 140, r.y, 9);
      this.good((l.x + r.x) / 2, (l.y + r.y) / 2);
      if (++this.matched === this.total) {
        this.locked = true;
        this.time.delayedCall(1100, () => { this.locked = false; this.i++; this.nextRound(); });
      }
    } else {
      a.mark('normal');
      shake(this, a);
      shake(this, card);
      this.bad('Chưa khớp rồi, bé thử lại nhé!');
    }
  }
}
