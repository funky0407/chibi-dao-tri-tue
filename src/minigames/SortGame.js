import { W, C, INK } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, panel, fit, shake } from '../ui/helpers.js';
import Audio from '../core/AudioManager.js';
import { rnd, shuffle, dec } from '../core/QuestionGenerator.js';

const CX = W / 2 + 60;
const ITEM_Y = 245;
const BIN_Y = 570;

// Nhóm sinh tự động theo luật (số chẵn/lẻ, so sánh, kết quả phép tính chẵn/lẻ).
const RULES = {
  parity: (cfg) => ({
    bins: [{ name: 'Số chẵn' }, { name: 'Số lẻ' }],
    next: () => { const v = rnd(1, cfg.max ?? 10); return { label: String(v), bin: v % 2 ? 1 : 0 }; },
  }),
  compare: (cfg) => ({
    bins: [{ name: `Bé hơn ${cfg.pivot}` }, { name: `Lớn hơn ${cfg.pivot}` }],
    next: () => { let v; do { v = rnd(1, cfg.max ?? 20); } while (v === cfg.pivot); return { label: String(v), bin: v < cfg.pivot ? 0 : 1 }; },
  }),
  // Dấu hiệu chia hết (lớp 4): một nửa số chia hết, một nửa không.
  divisible: (cfg) => ({
    bins: [{ name: `Chia hết cho ${cfg.by}` }, { name: 'Không chia hết' }],
    next: () => {
      const lo = cfg.min ?? 10, hi = cfg.max ?? 100;
      if (Math.random() < 0.5) {
        const v = cfg.by * rnd(Math.ceil(lo / cfg.by), Math.floor(hi / cfg.by));
        return { label: String(v), bin: 0 };
      }
      let v;
      do { v = rnd(lo, hi); } while (v % cfg.by === 0);
      return { label: String(v), bin: 1 };
    },
  }),
  // So sánh với 1: phân số (lớp 4) hoặc số thập phân (lớp 5).
  vsOne: (cfg) => ({
    bins: [{ name: 'Bé hơn 1' }, { name: 'Lớn hơn 1' }],
    next: () => {
      if (cfg.form === 'dec') {
        let v;
        do { v = rnd(1, 30) / 10; } while (v === 1);
        return { label: dec(v), bin: v < 1 ? 0 : 1 };
      }
      const n = rnd(2, 9);
      let a;
      do { a = rnd(1, n * 2); } while (a === n);
      return { label: `${a}/${n}`, bin: a < n ? 0 : 1 };
    },
  }),
  exprParity: (cfg) => ({
    bins: [{ name: 'Kết quả chẵn' }, { name: 'Kết quả lẻ' }],
    next: () => {
      const max = cfg.max ?? 20;
      const a = rnd(1, max - 1), add = Math.random() < 0.5, b = add ? rnd(1, max - a) : rnd(1, a);
      const r = add ? a + b : a - b;
      return { label: `${a} ${add ? '+' : '−'} ${b}`, bin: r % 2 ? 1 : 0 };
    },
  }),
};

// Phân loại: kéo (hoặc chạm giỏ) để bỏ từng món vào đúng nhóm.
export default class SortGame extends BaseMinigame {
  constructor() { super('sort'); }

  create() {
    this.setup();
    const cfg = this.cfg;
    if (cfg.rule) {
      const r = RULES[cfg.rule](cfg);
      this.binsData = r.bins;
      this.queue = Array.from({ length: cfg.rounds }, () => r.next());
    } else {
      const g = cfg.groups[cfg.group];
      this.binsData = g.bins;
      const items = shuffle(g.items.slice());
      this.queue = Array.from({ length: cfg.rounds }, (_, k) => items[k % items.length]);
    }
    this.i = 0;
    this.bins = this.makeBins();
    this.input.on('dragstart', (p, obj) => { obj.startX = obj.x; obj.startY = obj.y; });
    this.input.on('drag', (p, obj, x, y) => { obj.x = x; obj.y = y; });
    this.input.on('dragend', (p, obj) => this.dropItem(obj));
    this.mascot.say(`Bé xếp mỗi thứ vào đúng giỏ nhé: ${this.binsData.map((b) => b.name).join(' hay ')}?`);
    this.nextItem();
  }

  makeBins() {
    const n = this.binsData.length;
    const gap = n >= 3 ? 280 : 340;
    return this.binsData.map((b, k) => {
      const x = CX + (k - (n - 1) / 2) * gap;
      const basket = this.add.image(x, BIN_Y, 'basket').setScale(n >= 3 ? 0.95 : 1.1);
      panel(this, x, BIN_Y - 115, 230, 64, 0xffffff, 0.95, 22);
      if (b.icon) fit(this.add.image(x - 85, BIN_Y - 115, b.icon), 48);
      text(this, x + (b.icon ? 18 : 0), BIN_Y - 117, b.name, b.name.length > 10 ? 24 : 28, INK);
      const count = text(this, x, BIN_Y + 20, '', 34, '#ffffff', { stroke: '#a86b45', strokeThickness: 8 });
      basket.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.sendTo(k));
      return { x, y: BIN_Y, basket, count, n: 0 };
    });
  }

  nextItem() {
    if (this.i >= this.queue.length) return this.finish();
    this.setProgress(this.i, this.queue.length);
    const it = (this.cur = this.queue[this.i]);
    const c = this.add.container(CX, ITEM_Y).setDepth(20);
    const g = this.add.graphics();
    g.fillStyle(0x5b3a5e, 0.1).fillCircle(4, 8, 95);
    g.fillStyle(0xffffff, 1).fillCircle(0, 0, 95);
    g.lineStyle(6, C.yellow, 1).strokeCircle(0, 0, 92);
    c.add(g);
    if (it.item) c.add(fit(this.add.image(0, 0, it.item), 150));
    else {
      const len = it.label.length;
      c.add(text(this, 0, -2, it.label, len > 8 ? 32 : len > 5 ? 40 : len > 3 ? 54 : 80, INK));
    }
    c.setSize(190, 190).setInteractive({ useHandCursor: true, draggable: true });
    c.setScale(0);
    this.tweens.add({ targets: c, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.itemObj = c;
  }

  dropItem(obj) {
    const near = this.bins
      .map((b, k) => ({ k, d: Phaser.Math.Distance.Between(obj.x, obj.y, b.x, b.y - 40) }))
      .sort((a, b) => a.d - b.d)[0];
    if (near.d < 170) this.sendTo(near.k);
    else this.tweens.add({ targets: obj, x: CX, y: ITEM_Y, duration: 200 });
  }

  sendTo(k) {
    const obj = this.itemObj;
    if (!obj || this.locked) return;
    const bin = this.bins[k];
    if (this.cur.bin === k) {
      this.locked = true;
      this.good(bin.x, bin.y - 60);
      bin.count.setText(String(++bin.n));
      this.tweens.add({ targets: bin.basket, scaleY: bin.basket.scaleY * 0.9, duration: 90, yoyo: true });
      this.tweens.add({
        targets: obj, x: bin.x, y: bin.y - 30, scale: 0.35, duration: 280, ease: 'Quad.easeIn',
        onComplete: () => { obj.destroy(); this.itemObj = null; this.locked = false; this.i++; this.nextItem(); },
      });
    } else {
      this.tweens.add({ targets: obj, x: CX, y: ITEM_Y, duration: 220, onComplete: () => shake(this, obj) });
      const name = this.cur.label || 'Món này';
      this.bad(`${name} thuộc nhóm "${this.binsData[this.cur.bin].name}" đó, bé thử lại nhé!`);
    }
  }
}
