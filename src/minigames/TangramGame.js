import { W, C } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, burst } from '../ui/helpers.js';
import Audio from '../core/AudioManager.js';
import { pick, shuffle } from '../core/QuestionGenerator.js';

const FIG_X = 470;
const FIG_Y = 380;
const TRAY = [[960, 210], [1135, 210], [960, 350], [1135, 350], [960, 490], [1135, 490], [960, 625], [1135, 625]];
const COLORS = [0xff8fab, 0xffc94d, 0x5fd3a8, 0x6cc4ff, 0xb48cf0, 0xffa45c, 0xff6b6b, 0x8bc34a];

// Hình mẫu: mỗi mảnh là đa giác (toạ độ lưới, đã đặt đúng chỗ).
const FIGURES = {
  house: { name: 'Ngôi nhà', pieces: [[0, 1, 1, 0, 1, 1], [1, 0, 2, 1, 1, 1], [0, 1, 1, 1, 1, 2, 0, 2], [1, 1, 2, 1, 2, 2, 1, 2]] },
  boat: { name: 'Thuyền buồm', pieces: [[1, 0, 1, 2, -1, 2], [0, 2, 2, 2, 2, 3, 0, 3], [-1, 2, 0, 2, 0, 3], [2, 2, 3, 2, 2, 3]] },
  tree: { name: 'Cây thông', pieces: [[1, 0, 1, 1, 0, 1], [1, 0, 2, 1, 1, 1], [1, 1, 1, 3, -1, 3], [1, 1, 3, 3, 1, 3], [0.5, 3, 1.5, 3, 1.5, 4, 0.5, 4]] },
  fish: { name: 'Con cá', pieces: [[1, 0, 2, 1, 1, 1], [2, 1, 1, 2, 1, 1], [1, 2, 0, 1, 1, 1], [0, 1, 1, 0, 1, 1], [2, 1, 3, 0, 3, 2]] },
  cat: { name: 'Con mèo', pieces: [[0, 0, 0, 1, 1, 1], [2, 0, 2, 1, 1, 1], [0, 1, 1, 1, 1, 2, 0, 2], [1, 1, 2, 1, 2, 2, 1, 2], [0, 2, 2, 2, 0, 4], [2, 2, 2, 4, 0, 4], [2, 3, 4, 3, 4, 4, 2, 4]] },
};
const DECOY = [1, 0, 2, 0, 1, 1, 0, 1]; // hình bình hành, không có trong hình mẫu nào

const toPts = (flat) => { const p = []; for (let k = 0; k < flat.length; k += 2) p.push([flat[k], flat[k + 1]]); return p; };
const centroid = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
const rotate = (pts, deg) => {
  const a = (deg * Math.PI) / 180, cs = Math.round(Math.cos(a)), sn = Math.round(Math.sin(a));
  return pts.map(([x, y]) => [x * cs - y * sn, x * sn + y * cs]);
};
// Hai đa giác (toạ độ tương đối) trùng nhau, không kể thứ tự đỉnh.
const sameShape = (a, b) => a.length === b.length && a.every(([x, y]) => b.some(([u, v]) => Math.abs(x - u) < 0.01 && Math.abs(y - v) < 0.01));

// Tangram: kéo các mảnh vào đúng khung bóng; chạm vào mảnh để xoay 90°.
export default class TangramGame extends BaseMinigame {
  constructor() { super('tangram'); }

  create() {
    this.setup();
    this.figs = this.cfg.figures;
    this.i = 0;
    this.objs = [];
    this.input.on('dragstart', (p, obj) => { obj.setDepth(50); obj.startX = obj.x; obj.startY = obj.y; });
    this.input.on('drag', (p, obj, x, y) => { obj.x = x; obj.y = y; });
    this.input.on('dragend', (p, obj) => this.drop(obj));
    this.nextRound();
  }

  nextRound() {
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
    if (this.i >= this.figs.length) return this.finish();
    this.setProgress(this.i, this.figs.length);
    const fig = (this.fig = FIGURES[this.figs[this.i]]);
    const all = fig.pieces.flatMap(toPts);
    const minX = Math.min(...all.map((p) => p[0])), maxX = Math.max(...all.map((p) => p[0]));
    const minY = Math.min(...all.map((p) => p[1])), maxY = Math.max(...all.map((p) => p[1]));
    // Hình mẫu nhỏ thì phóng to mảnh cho dễ nhìn (hình lớn 4×4 vẫn vừa khung).
    const U = (this.U = Math.min(95, 330 / Math.max(maxX - minX, maxY - minY)));
    const ox = FIG_X - ((minX + maxX) / 2) * U, oy = FIG_Y - ((minY + maxY) / 2) * U;

    // Khung bóng + (tuỳ cấp) viền gợi ý từng mảnh
    const g = this.add.graphics();
    this.objs.push(g);
    this.slots = fig.pieces.map((flat) => {
      const pts = toPts(flat);
      const [cx, cy] = centroid(pts);
      const screen = pts.map(([x, y]) => ({ x: ox + x * U, y: oy + y * U }));
      g.fillStyle(0x7d5bd6, 0.85).fillPoints(screen, true);
      if (this.cfg.hints) g.lineStyle(3, 0xffffff, 0.9).strokePoints(screen, true);
      return { x: ox + cx * U, y: oy + cy * U, rel: pts.map(([x, y]) => [x - cx, y - cy]), filled: false };
    });
    this.objs.push(text(this, FIG_X, 130, `Ghép hình: ${fig.name}`, 40, '#8a5cd6'));

    const shapes = fig.pieces.map(toPts);
    if (this.cfg.decoy) shapes.push(toPts(DECOY));
    shuffle(shapes.map((s, k) => ({ s, k }))).forEach(({ s, k }, slot) => {
      const [x, y] = TRAY[slot];
      this.objs.push(this.makePiece(s, COLORS[k % COLORS.length], x, y));
    });
    this.mascot.say(this.cfg.rotate
      ? 'Bé kéo các mảnh vào khung. Chạm vào mảnh để xoay cho đúng hướng nhé!'
      : 'Bé kéo các mảnh vào đúng chỗ trong khung nhé!');
  }

  makePiece(pts, color, x, y) {
    const [cx, cy] = centroid(pts);
    const rel = pts.map(([px, py]) => [px - cx, py - cy]);
    const U = this.U;
    const c = this.add.container(x, y).setDepth(20);
    const g = this.add.graphics();
    const screen = rel.map(([px, py]) => ({ x: px * U, y: py * U }));
    g.fillStyle(color, 1).fillPoints(screen, true);
    g.lineStyle(4, 0xffffff, 1).strokePoints(screen, true);
    c.add(g);
    const w = (Math.max(...rel.map((p) => p[0])) - Math.min(...rel.map((p) => p[0]))) * U;
    const h = (Math.max(...rel.map((p) => p[1])) - Math.min(...rel.map((p) => p[1]))) * U;
    c.setSize(Math.max(w, 60), Math.max(h, 60)).setInteractive({ useHandCursor: true, draggable: true });
    c.rel = rel;
    c.homeX = x;
    c.homeY = y;
    c.setAngle(this.cfg.rotate ? pick([90, 180, 270]) : 0);
    return c;
  }

  drop(piece) {
    piece.setDepth(20);
    const moved = Phaser.Math.Distance.Between(piece.x, piece.y, piece.startX, piece.startY);
    if (moved < 10) {
      // Chạm nhẹ = xoay 90°
      if (!this.cfg.rotate) return;
      Audio.pop();
      this.tweens.add({ targets: piece, angle: piece.angle + 90, duration: 150 });
      return;
    }
    const shape = rotate(piece.rel, Math.round(piece.angle / 90) * 90);
    const near = this.slots
      .filter((s) => !s.filled)
      .map((s) => ({ s, d: Phaser.Math.Distance.Between(piece.x, piece.y, s.x, s.y) }))
      .filter((o) => o.d < 70)
      .sort((a, b) => a.d - b.d);
    const fit = near.find((o) => sameShape(o.s.rel, shape));
    if (fit) {
      fit.s.filled = true;
      piece.disableInteractive();
      this.tweens.add({ targets: piece, x: fit.s.x, y: fit.s.y, duration: 160, ease: 'Back.easeOut' });
      this.good();
      if (this.slots.every((s) => s.filled)) this.complete();
      return;
    }
    this.tweens.add({ targets: piece, x: piece.homeX, y: piece.homeY, duration: 220 });
    if (!near.length) return;
    // Thả gần một ô nhưng chưa khớp: sai hướng hoặc sai mảnh
    const sameIfRotated = near.some((o) => [0, 90, 180, 270].some((a) => sameShape(o.s.rel, rotate(piece.rel, a))));
    this.bad(sameIfRotated ? 'Mảnh này đúng rồi, bé chạm vào để xoay cho đúng hướng nhé!' : 'Mảnh này chưa vừa chỗ đó, bé thử mảnh khác nhé!');
  }

  complete() {
    this.time.delayedCall(250, () => {
      burst(this, FIG_X, FIG_Y, 30);
      Audio.win();
      this.mascot.say(`Hoan hô! Bé đã ghép xong ${this.fig.name.toLowerCase()}!`, { duration: 1800 });
    });
    this.time.delayedCall(1800, () => { this.i++; this.nextRound(); });
  }
}
