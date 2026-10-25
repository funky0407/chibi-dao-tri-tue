import { W, C, INK } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, panel, choiceCard, shake, fit } from '../ui/helpers.js';
import { patternRound, numberSeq } from '../core/QuestionGenerator.js';

// Tìm hình (hoặc số, khi mode = "number") còn thiếu trong dãy có quy luật.
export default class PatternGame extends BaseMinigame {
  constructor() { super('pattern'); }

  create() {
    this.setup();
    this.numbers = this.cfg.mode === 'number';
    this.i = 0;
    this.n = this.numbers ? this.cfg.rounds ?? 5 : this.cfg.patterns.length;
    this.nextRound();
  }

  // Một ô trong dãy: hình đồ vật hoặc thẻ số.
  cell(x, y, val, size) {
    if (!this.numbers) return fit(this.add.image(x, y, val), size);
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0xe8fbf3, 1).fillRoundedRect(-size / 2, -size / 2, size, size, 18);
    g.lineStyle(4, C.mint, 1).strokeRoundedRect(-size / 2, -size / 2, size, size, 18);
    c.add([g, text(this, 0, -2, String(val), Math.min(56, size * 0.5), INK)]);
    return c;
  }

  nextRound() {
    if (this.i >= this.n) return this.finish();
    this.setProgress(this.i, this.n);
    if (this.L) this.L.destroy();
    const L = (this.L = this.add.container(0, 0));
    const hide = this.cfg.hide;
    const hideLast = hide === 'last' || (hide === 'mixed' && this.i < 2);
    const q = this.numbers
      ? numberSeq(this.cfg, hideLast)
      : patternRound(this.cfg.patterns[this.i], this.cfg.pool, hideLast, this.cfg.choices ?? 3);

    L.add(text(this, W / 2, 130, this.numbers ? 'Số nào còn thiếu?' : 'Hình nào còn thiếu?', 52, '#8a5cd6'));
    this.mascot.say(this.numbers ? 'Bé xem các số tăng hay giảm bao nhiêu nhé!' : 'Bé nhìn quy luật và tìm hình còn thiếu nhé!', { duration: 3000 });

    const step = Math.min(130, 1080 / q.seq.length);
    const size = step - 22;
    const x0 = W / 2 - ((q.seq.length - 1) * step) / 2;
    L.add(panel(this, W / 2, 290, q.seq.length * step + 40, step + 50, 0xffffff, 0.85));
    let slotPos;
    q.seq.forEach((val, k) => {
      const x = x0 + k * step;
      if (k === q.hide) {
        slotPos = { x, y: 290 };
        const g = this.add.graphics();
        g.lineStyle(5, C.purple, 1).strokeRoundedRect(x - size / 2, 290 - size / 2, size, size, 18);
        g.fillStyle(0xf3ecff, 1).fillRoundedRect(x - size / 2 + 3, 290 - size / 2 + 3, size - 6, size - 6, 16);
        const qm = text(this, x, 290, '?', size * 0.7, '#9a74e8');
        this.tweens.add({ targets: qm, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
        L.add([g, qm]);
        this.qm = qm;
      } else {
        L.add(this.cell(x, 290, val, size));
      }
    });

    const nc = q.choices.length;
    const gap = nc >= 5 ? 190 : 220;
    q.choices.forEach((val, k) => {
      const x = W / 2 + 60 + (k - (nc - 1) / 2) * gap;
      const opts = this.numbers ? { label: val, size: 60 } : { image: val, imageSize: 110 };
      const card = choiceCard(this, x, 510, nc >= 5 ? 160 : 170, 150, { color: C.mint, ...opts });
      L.add(card);
      card.on('pointerdown', () => {
        if (this.locked || card.disabled) return;
        if (val === q.answer) {
          this.locked = true;
          card.mark('right');
          this.qm.setVisible(false);
          const fly = this.cell(card.x, card.y, val, size);
          L.add(fly);
          this.tweens.add({ targets: fly, x: slotPos.x, y: slotPos.y, duration: 350, ease: 'Cubic.easeOut' });
          this.time.delayedCall(350, () => this.good(slotPos.x, slotPos.y));
          this.time.delayedCall(1200, () => { this.locked = false; this.i++; this.nextRound(); });
        } else {
          card.disabled = true;
          card.mark('wrong');
          shake(this, card);
          this.bad(this.numbers ? 'Bé tính xem mỗi lần tăng hay giảm mấy nhé!' : 'Bé nhìn kỹ các hình lặp lại nhé!');
        }
      });
    });
  }
}
