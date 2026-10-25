import { W, C, INK } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, fit, burst, confetti, shake } from '../ui/helpers.js';
import { chibiImage } from '../art/svg.js';
import Save from '../core/SaveManager.js';
import Audio from '../core/AudioManager.js';
import { rnd, pick, shuffle } from '../core/QuestionGenerator.js';

const CX = 760;
const CY = 385;

// Đường đi ngẫu nhiên từ góc trên trái tới góc dưới phải (DFS, ưu tiên hướng xuống/sang phải cho đường không quá dài).
function randomPath(n) {
  const seen = new Set();
  const path = [];
  const dfs = (r, c) => {
    path.push([r, c]);
    seen.add(r * n + c);
    if (r === n - 1 && c === n - 1) return true;
    const fwd = shuffle([[1, 0], [0, 1]]), back = shuffle([[-1, 0], [0, -1]]);
    const dirs = Math.random() < 0.65 ? fwd.concat(back) : shuffle(fwd.concat(back));
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen.has(nr * n + nc)) continue;
      if (dfs(nr, nc)) return true;
    }
    path.pop();
    return false;
  };
  dfs(0, 0);
  return path;
}

// Phép tính có kết quả bằng v (dùng + − và × nếu có).
function expr(v, ops) {
  const options = [];
  if (ops.includes('add') && v >= 2) { const a = rnd(1, v - 1); options.push(`${a} + ${v - a}`); }
  if (ops.includes('sub')) { const b = rnd(1, 9); options.push(`${v + b} − ${b}`); }
  if (ops.includes('mul')) {
    const pairs = [];
    for (let a = 2; a <= 10; a++) if (v % a === 0 && v / a <= 10 && v / a >= 2) pairs.push(`${a} × ${v / a}`);
    if (pairs.length) options.push(pick(pairs));
  }
  return pick(options.length ? options : [`${v}`]);
}

// Luật đi của mê cung: mỗi luật cho biết ô hợp lệ hiển thị gì và ô sai hiển thị gì.
const RULES = {
  seq: (cfg) => ({
    title: `Đi theo các số ${cfg.step}, ${cfg.step * 2}, ${cfg.step * 3}... tới ngôi sao`,
    hint: `Bé tìm số tiếp theo, mỗi lần thêm ${cfg.step} nhé!`,
    ordered: true,
  }),
  even: () => ({
    title: 'Chỉ đi trên các số chẵn để tới ngôi sao',
    hint: 'Số chẵn là 2, 4, 6, 8, 10... bé thử lại nhé!',
    valid: () => String(rnd(1, 15) * 2),
    invalid: () => String(rnd(0, 14) * 2 + 1),
  }),
  table: (cfg) => ({
    title: `Chỉ đi trên các số trong bảng nhân ${cfg.table}`,
    hint: `Bé đọc lại bảng nhân ${cfg.table} nhé!`,
    valid: () => String(cfg.table * rnd(1, 10)),
    invalid: () => { let v; do { v = rnd(1, cfg.table * 10); } while (v % cfg.table === 0); return String(v); },
  }),
  sum: (cfg) => ({
    title: `Chỉ đi trên ô có kết quả bằng ${cfg.target}`,
    hint: `Bé tính kết quả từng ô, ô nào bằng ${cfg.target} thì đi nhé!`,
    valid: () => expr(cfg.target, cfg.ops),
    invalid: () => expr(cfg.target + pick([-2, -1, 1, 2]), cfg.ops),
  }),
};

// Mê cung số: chạm ô bên cạnh để đi; chỉ được đi trên ô đúng luật.
export default class MazeGame extends BaseMinigame {
  constructor() { super('maze'); }

  create() {
    this.setup();
    this.moving = false;
    this.n = this.cfg.size;
    this.rule = RULES[this.cfg.rule](this.cfg);
    this.cs = Math.min(86, 470 / this.n);
    text(this, CX, 118, this.rule.title, 30, '#8a5cd6');
    this.build();
    this.mascot.say(`${this.rule.title}. Bé chạm vào ô bên cạnh để đi nhé!`);
  }

  pos(r, c) {
    const half = (this.n * this.cs) / 2;
    return { x: CX - half + (c + 0.5) * this.cs, y: CY - half + (r + 0.5) * this.cs };
  }

  build() {
    const n = this.n;
    const path = randomPath(n);
    this.pathLen = path.length;
    const idx = new Map(path.map(([r, c], i) => [r * n + c, i]));
    this.cells = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const i = idx.get(r * n + c);
        const cell = { r, c, pathIndex: i, valid: i !== undefined, start: i === 0, goal: i === path.length - 1 };
        if (this.rule.ordered) cell.label = cell.valid ? String(i * this.cfg.step) : null;
        else cell.label = cell.valid ? this.rule.valid() : this.rule.invalid();
        this.cells.push(cell);
      }
    }
    if (this.rule.ordered) this.fillOrderedDecoys();
    this.cells.forEach((cell) => this.drawCell(cell));
    this.cur = this.cells[0];
    this.steps = 0;
    const p = this.pos(0, 0);
    this.kid = chibiImage(this, p.x, p.y + this.cs * 0.1, Save.player, 'happy').setScale((this.cs * 1.15) / 390).setDepth(20);
  }

  // Ô sai ở mê cung "theo thứ tự" không được trùng số tiếp theo của ô đường đi nằm cạnh nó.
  fillOrderedDecoys() {
    const n = this.n, step = this.cfg.step;
    const at = (r, c) => (r >= 0 && c >= 0 && r < n && c < n ? this.cells[r * n + c] : null);
    this.cells.filter((x) => !x.valid).forEach((cell) => {
      const banned = new Set();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
        const nb = at(cell.r + dr, cell.c + dc);
        if (nb && nb.valid) banned.add((nb.pathIndex + 1) * step);
      });
      const candidates = shuffle(Array.from({ length: this.pathLen + 2 }, (_, k) => (k + 1) * step));
      cell.label = String(candidates.find((v) => !banned.has(v)) ?? (this.pathLen + 3) * step);
    });
  }

  drawCell(cell) {
    const { x, y } = this.pos(cell.r, cell.c);
    const s = this.cs - 8;
    const g = this.add.graphics();
    cell.g = g;
    cell.x = x; cell.y = y;
    this.paintCell(cell, cell.start ? 0xffd6e3 : 0xffffff);
    if (cell.goal) {
      const st = this.add.image(x, y, 'staritem');
      fit(st, s * 0.85);
      this.tweens.add({ targets: st, scale: st.scale * 1.12, duration: 500, yoyo: true, repeat: -1 });
    } else if (!cell.start) {
      cell.text = text(this, x, y - 2, cell.label, cell.label.length > 4 ? Math.round(s * 0.29) : Math.round(s * 0.38), INK, { strokeThickness: 0 });
    }
    g.setInteractive(new Phaser.Geom.Rectangle(x - s / 2, y - s / 2, s, s), Phaser.Geom.Rectangle.Contains);
    g.on('pointerdown', () => this.tap(cell));
  }

  paintCell(cell, color) {
    const s = this.cs - 8;
    cell.g.clear();
    cell.g.fillStyle(0x5b3a5e, 0.1).fillRoundedRect(cell.x - s / 2 + 3, cell.y - s / 2 + 5, s, s, 14);
    cell.g.fillStyle(color, 1).fillRoundedRect(cell.x - s / 2, cell.y - s / 2, s, s, 14);
    cell.g.lineStyle(3, 0x8bc34a, 1).strokeRoundedRect(cell.x - s / 2, cell.y - s / 2, s, s, 14);
  }

  tap(cell) {
    if (this.finished || this.moving) return;
    const adj = Math.abs(cell.r - this.cur.r) + Math.abs(cell.c - this.cur.c) === 1;
    if (!adj) {
      if (cell !== this.cur) this.mascot.say('Bé chạm vào ô ngay bên cạnh nhân vật nhé!', { duration: 2000 });
      return;
    }
    if (cell.goal) {
      const ready = !this.rule.ordered || this.cur.pathIndex === this.pathLen - 2;
      if (!ready) { this.wrongCell(cell); return; }
      this.moveTo(cell, () => this.win());
      return;
    }
    if (cell.start || cell.visited) { this.moveTo(cell); return; }
    const ok = this.rule.ordered
      ? cell.valid && cell.pathIndex === this.cur.pathIndex + 1
      : cell.valid;
    if (!ok) { this.wrongCell(cell); return; }
    cell.visited = true;
    this.paintCell(cell, 0xd7f2b8);
    this.good(cell.x, cell.y, { sound: false });
    Audio.tone(440 + Math.min(this.steps++, 20) * 30, 0.12, { type: 'triangle' });
    this.moveTo(cell);
  }

  wrongCell(cell) {
    this.paintCell(cell, 0xffd0d0);
    this.time.delayedCall(500, () => this.paintCell(cell, cell.visited ? 0xd7f2b8 : 0xffffff));
    if (cell.text) shake(this, cell.text);
    this.bad(this.rule.hint);
  }

  moveTo(cell, done) {
    this.cur = cell;
    this.moving = true;
    this.tweens.add({
      targets: this.kid, x: cell.x, y: cell.y + this.cs * 0.1, duration: 180, ease: 'Quad.easeOut',
      onComplete: () => { this.moving = false; if (done) done(); },
    });
  }

  win() {
    burst(this, this.cur.x, this.cur.y, 30);
    confetti(this);
    Audio.win();
    this.mascot.say('Bé đã tới ngôi sao rồi! Giỏi quá!');
    this.time.delayedCall(1800, () => this.finish());
  }
}
