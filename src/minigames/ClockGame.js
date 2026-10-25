import { W, C } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, choiceCard, shake } from '../ui/helpers.js';
import { clockFace, timeLabel, randomTime, clockChoices } from '../ui/Clock.js';

// Xem đồng hồ. mode "read": nhìn đồng hồ chọn giờ đúng; mode "pick": đọc giờ, chọn đồng hồ đúng.
export default class ClockGame extends BaseMinigame {
  constructor() { super('clock'); }

  create() {
    this.setup();
    this.i = 0;
    this.n = this.cfg.rounds ?? 6;
    this.nextRound();
  }

  nextRound() {
    if (this.i >= this.n) return this.finish();
    this.setProgress(this.i, this.n);
    if (this.L) this.L.destroy();
    const L = (this.L = this.add.container(0, 0));
    const { step, kem, close } = this.cfg;
    const nc = this.cfg.choices ?? 3;
    const t = randomTime(step);
    const label = timeLabel(t, kem);
    const choices = clockChoices(t, nc, step, close);
    const pick = this.cfg.mode === 'pick';

    if (pick) {
      L.add(text(this, W / 2, 125, 'Đồng hồ nào chỉ', 44, '#8a5cd6'));
      L.add(text(this, W / 2, 200, label, 64, '#ff5f93', { strokeThickness: 12 }));
      this.mascot.say(`Đồng hồ nào chỉ ${label}?`, { duration: 3000 });
    } else {
      L.add(text(this, W / 2, 125, 'Đồng hồ chỉ mấy giờ?', 48, '#8a5cd6'));
      L.add(clockFace(this, W / 2, 300, 125, t.h, t.m));
      this.mascot.say('Đồng hồ chỉ mấy giờ? Kim ngắn chỉ giờ, kim dài chỉ phút nhé!', { duration: 3000 });
    }

    const gap = pick ? (nc >= 4 ? 235 : 260) : (nc >= 4 ? 250 : 290);
    choices.forEach((c, k) => {
      const x = W / 2 + 60 + (k - (nc - 1) / 2) * gap;
      const lab = timeLabel(c, kem);
      const card = pick
        ? choiceCard(this, x, 440, 215, 215, { color: C.sky })
        : choiceCard(this, x, 545, gap - 25, 100, { label: lab, size: lab.length > 14 ? 24 : 30, color: C.sky });
      if (pick) card.add(clockFace(this, 0, 0, 82, c.h, c.m));
      L.add(card);
      card.on('pointerdown', () => {
        if (this.locked || card.disabled) return;
        if (c === t) {
          this.locked = true;
          card.mark('right');
          this.good(card.x, card.y);
          this.time.delayedCall(1000, () => { this.locked = false; this.i++; this.nextRound(); });
        } else {
          card.disabled = true;
          card.mark('wrong');
          shake(this, card);
          this.bad(pick ? `Đồng hồ đó chỉ ${lab}. Bé tìm lại nhé!` : 'Kim ngắn chỉ giờ, kim dài chỉ phút nhé!');
        }
      });
    });
  }
}
