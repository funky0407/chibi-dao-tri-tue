import { W, C, INK } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, button, shake, burst, hex, shade } from '../ui/helpers.js';
import Audio from '../core/AudioManager.js';
import { rnd, pick, shuffle } from '../core/QuestionGenerator.js';

const CX = W / 2 + 60;
const PIVOT_Y = 270;
const ARM = 260;
const HANG = 120;
const SHELF_Y = 628;
const BLOCK_COLORS = { 1: 0xff8fab, 2: 0xffc94d, 5: 0x5fd3a8, 10: 0x6cc4ff, 20: 0xb48cf0, 50: 0xffa45c };

// Cân thăng bằng: bên trái có sẵn quả cân, bé chạm các quả cân ở kệ để đặt sang bên phải cho tới khi cân bằng.
// Chạm quả cân trên đĩa phải để bỏ ra.
export default class BalanceGame extends BaseMinigame {
  constructor() { super('balance'); }

  create() {
    this.setup();
    this.i = 0;
    this.n = this.cfg.rounds ?? 5;
    this.drawStand();
    this.nextRound();
  }

  drawStand() {
    const g = this.add.graphics();
    g.fillStyle(0xa86b45, 1).fillRoundedRect(CX - 90, PIVOT_Y + 250, 180, 26, 12);
    g.fillStyle(0xc08552, 1).fillRect(CX - 12, PIVOT_Y, 24, 255);
    this.beam = this.add.container(CX, PIVOT_Y).setDepth(5);
    const bg = this.add.graphics();
    bg.fillStyle(0xe0a62a, 1).fillRoundedRect(-ARM - 12, -6, ARM * 2 + 24, 20, 10);
    bg.fillStyle(0xffd166, 1).fillRoundedRect(-ARM - 12, -12, ARM * 2 + 24, 20, 10);
    this.beam.add(bg);
    this.add.circle(CX, PIVOT_Y, 16, C.pink).setStrokeStyle(4, 0xffffff).setDepth(6);
    this.strings = this.add.graphics().setDepth(4);
    this.pans = [-1, 1].map((side) => {
      const p = this.add.container(CX + side * ARM, PIVOT_Y + HANG).setDepth(6);
      const pg = this.add.graphics();
      pg.fillStyle(0x6cc4ff, 1).fillRoundedRect(-105, 0, 210, 18, 9);
      pg.fillStyle(0x4ea8e8, 1).fillRoundedRect(-80, 16, 160, 10, 5);
      p.add(pg);
      p.blocks = this.add.container(0, 0);
      p.add(p.blocks);
      return p;
    });
    this.sumText = text(this, CX + ARM, PIVOT_Y + HANG + 60, '', 30, '#4ea8e8').setDepth(7);
  }

  // Vẽ quả cân (hình thang có quai) với số.
  block(value, label = String(value)) {
    const w = Math.max(62, label.length * 18 + 30);
    const c = this.add.container(0, 0);
    const palette = Object.values(BLOCK_COLORS);
    const color = BLOCK_COLORS[value] || palette[value % palette.length];
    const g = this.add.graphics();
    g.lineStyle(5, shade(color, 0.7), 1).strokeCircle(0, -34, 9);
    g.fillStyle(shade(color, 0.8), 1).fillPoints([{ x: -w / 2 + 8, y: -26 }, { x: w / 2 - 8, y: -26 }, { x: w / 2, y: 4 }, { x: -w / 2, y: 4 }], true);
    g.fillStyle(color, 1).fillPoints([{ x: -w / 2 + 8, y: -30 }, { x: w / 2 - 8, y: -30 }, { x: w / 2, y: 0 }, { x: -w / 2, y: 0 }], true);
    c.add([g, text(this, 0, -15, label, 24, '#ffffff', { stroke: hex(shade(color, 0.6)), strokeThickness: 5 })]);
    c.w = w;
    c.value = value;
    return c;
  }

  // Sinh một câu: quả cân bên trái, quả cân có sẵn bên phải (nếu có) và kệ quả cân.
  makeRound() {
    const cfg = this.cfg;
    const left = [];
    let given = 0, target, shelf;
    if (cfg.left === 'mul') {
      const a = pick(cfg.tables || [2, 5]), b = rnd(2, 10);
      target = a * b;
      left.push({ value: target, label: `${a} × ${b}` });
    } else if (cfg.left === 'sum2') {
      if (cfg.given) {
        // Cấp siêu khó: bên phải có sẵn 1 quả cân, phần còn thiếu ghép được bằng tối đa maxBlocks quả.
        given = rnd(5, 30);
        const parts = Array.from({ length: rnd(1, cfg.maxBlocks) }, () => pick(cfg.blocks));
        target = given + parts.reduce((s, v) => s + v, 0);
      } else target = rnd(4, cfg.max);
      const a = rnd(1, target - 1);
      left.push({ value: a }, { value: target - a });
    } else {
      target = rnd(cfg.min ?? 2, cfg.max);
      left.push({ value: target });
    }
    if (cfg.unique) {
      // Đúng 2 quả cân trên kệ cộng lại bằng bên trái.
      // Hai quả cân phải khác nhau, nếu không kệ chỉ còn một quả và câu không giải được.
      let a;
      do { a = rnd(2, target - 2); } while (a * 2 === target);
      const set = new Set([a, target - a]);
      while (set.size < (cfg.shelfSize ?? 5)) set.add(rnd(2, Math.max(9, target - 1)));
      shelf = shuffle([...set]);
    } else shelf = cfg.blocks;
    return { left, given, target, shelf };
  }

  nextRound() {
    if (this.i >= this.n) return this.finish();
    this.setProgress(this.i, this.n);
    if (this.shelfLayer) this.shelfLayer.destroy();
    this.pans.forEach((p) => p.blocks.removeAll(true));
    const r = (this.round = this.makeRound());
    this.right = r.given;
    this.placed = [];
    this.done = false;
    this.layout(this.pans[0], r.left.map((b) => this.block(b.value, b.label)));
    if (r.given) {
      const g = this.block(r.given);
      g.given = true;
      this.layout(this.pans[1], [g]);
    }
    this.shelfLayer = this.add.container(0, 0).setDepth(8);
    const gap = Math.min(120, 620 / r.shelf.length);
    r.shelf.forEach((v, k) => {
      const b = this.block(v);
      b.setPosition(CX + 170 + (k - (r.shelf.length - 1) / 2) * gap, SHELF_Y);
      b.setSize(b.w, 48).setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => this.addBlock(b));
      this.shelfLayer.add(b);
    });
    let msg = 'Bé đặt quả cân sang đĩa bên phải cho hai bên bằng nhau nhé!';
    if (this.cfg.unique) msg = 'Bé chọn đúng 2 quả cân để cân bằng nhé!';
    else if (this.cfg.maxBlocks) msg = `Bé dùng nhiều nhất ${this.cfg.maxBlocks} quả cân để cân bằng nhé!`;
    this.mascot.say(msg, { duration: 3500 });
    this.refresh();
  }

  // Xếp quả cân thành hàng (tối đa 3 quả một hàng) trên đĩa.
  layout(pan, blocks) {
    blocks.forEach((b) => pan.blocks.add(b));
    const all = pan.blocks.list;
    all.forEach((b, k) => {
      const row = Math.floor(k / 3), inRow = Math.min(3, all.length - row * 3);
      b.setPosition(((k % 3) - (inRow - 1) / 2) * 70, -row * 42 - 2);
    });
  }

  addBlock(src) {
    if (this.done || this.locked) return;
    const r = this.round;
    const extra = this.placed.length + 1;
    const limit = this.cfg.unique ? 2 : this.cfg.maxBlocks;
    if (this.right + src.value > r.target) {
      shake(this, src);
      this.bad('Nặng quá rồi! Bé thử quả cân nhẹ hơn nhé!');
      return;
    }
    if (limit && extra > limit) {
      shake(this, src);
      this.bad(`Chỉ được dùng ${limit} quả cân thôi, bé bỏ bớt ra nhé!`);
      return;
    }
    Audio.tone(330 + src.value * 8, 0.1, { type: 'triangle' });
    const b = this.block(src.value);
    b.setSize(b.w, 48).setInteractive({ useHandCursor: true });
    b.on('pointerdown', () => this.removeBlock(b));
    b.src = src;
    if (this.cfg.unique) src.setVisible(false);
    this.placed.push(b);
    this.right += src.value;
    this.layout(this.pans[1], [b]);
    this.refresh();
    if (this.right === r.target) this.balanced();
    else if (this.cfg.unique && extra === 2) {
      this.time.delayedCall(500, () => {
        this.bad('Hai quả cân này chưa bằng bên trái, bé thử cặp khác nhé!');
        this.removeBlock(b);
      });
    }
  }

  removeBlock(b) {
    if (this.done) return;
    this.placed = this.placed.filter((x) => x !== b);
    this.right -= b.value;
    if (b.src) b.src.setVisible(true);
    b.destroy();
    this.layout(this.pans[1], []);
    this.refresh();
  }

  refresh() {
    const r = this.round;
    const diff = r.target - this.right;
    const angle = Phaser.Math.Clamp(diff / r.target, -1, 1) * -12;
    this.tweens.add({ targets: this.beam, angle, duration: 350, ease: 'Back.easeOut' });
    this.sumText.setText(this.cfg.showSum === false ? '' : `= ${this.right}`);
  }

  update() {
    // Đĩa cân treo theo hai đầu đòn cân.
    const rad = this.beam.rotation;
    this.strings.clear().lineStyle(3, 0x5b3a5e, 0.8);
    this.pans.forEach((p, k) => {
      const side = k ? 1 : -1;
      const ex = CX + Math.cos(rad) * ARM * side, ey = PIVOT_Y + Math.sin(rad) * ARM * side;
      p.setPosition(ex, ey + HANG);
      this.strings.lineBetween(ex, ey, ex - 100, ey + HANG).lineBetween(ex, ey, ex + 100, ey + HANG);
    });
    this.sumText.setPosition(this.pans[1].x, this.pans[1].y + 52);
  }

  balanced() {
    this.done = true;
    this.good(CX, PIVOT_Y);
    burst(this, this.pans[1].x, this.pans[1].y - 40, 16);
    this.mascot.say('Cân bằng rồi! Bé giỏi quá!', { duration: 1500 });
    this.time.delayedCall(1300, () => { this.i++; this.nextRound(); });
  }
}
