import { W, C, INK } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, button, fit, burst, shake } from '../ui/helpers.js';
import Audio from '../core/AudioManager.js';
import { rnd, shuffle } from '../core/QuestionGenerator.js';

const GX = 560;
const GY = 395;
const BAR_Y = 122;
// Hướng đi: [dòng, cột, ảnh mũi tên note_k, góc xoay]
const DIRS = {
  L: { dr: 0, dc: -1, tex: 'note_0', rot: -90 },
  U: { dr: -1, dc: 0, tex: 'note_1', rot: 0 },
  D: { dr: 1, dc: 0, tex: 'note_2', rot: 180 },
  R: { dr: 0, dc: 1, tex: 'note_3', rot: 90 },
};

// Số "đoạn thẳng" ít nhất để đi từ start tới goal (mỗi lần đổi hướng là thêm một lệnh).
function minRuns(n, blocked, start, goal) {
  const key = (r, c, d) => `${r},${c},${d}`;
  const best = new Map();
  const queue = [];
  for (const d of Object.keys(DIRS)) { best.set(key(start[0], start[1], d), 1); queue.push([start[0], start[1], d, 1]); }
  let result = Infinity;
  while (queue.length) {
    queue.sort((a, b) => a[3] - b[3]);
    const [r, c, d, cost] = queue.shift();
    if (cost > (best.get(key(r, c, d)) ?? Infinity)) continue;
    if (r === goal[0] && c === goal[1]) { result = Math.min(result, cost); continue; }
    for (const nd of Object.keys(DIRS)) {
      const nr = r + DIRS[nd].dr, nc = c + DIRS[nd].dc;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n || blocked.has(nr * n + nc)) continue;
      const ncost = cost + (nd === d ? 0 : 1);
      const k = key(nr, nc, nd);
      if (ncost < (best.get(k) ?? Infinity)) { best.set(k, ncost); queue.push([nr, nc, nd, ncost]); }
    }
  }
  return result;
}

function shortestLen(n, blocked, start, goal) {
  const dist = new Map([[start[0] * n + start[1], 0]]);
  const q = [start];
  while (q.length) {
    const [r, c] = q.shift();
    if (r === goal[0] && c === goal[1]) return dist.get(r * n + c);
    for (const d of Object.values(DIRS)) {
      const nr = r + d.dr, nc = c + d.dc, k = nr * n + nc;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n || blocked.has(k) || dist.has(k)) continue;
      dist.set(k, dist.get(r * n + c) + 1);
      q.push([nr, nc]);
    }
  }
  return Infinity;
}

// Lập trình robot: xếp chuỗi lệnh mũi tên rồi bấm "Chạy" để robot đi tới ngôi sao.
export default class CodeGame extends BaseMinigame {
  constructor() { super('coding'); }

  create() {
    this.setup();
    // Scene được dùng lại giữa các lần chơi, nên phải đặt lại cờ đang chạy.
    this.running = false;
    this.i = 0;
    this.n = this.cfg.rounds ?? 3;
    this.makeControls();
    this.nextRound();
  }

  makeControls() {
    const pos = { U: [1090, 290], L: [1010, 370], R: [1170, 370], D: [1090, 450] };
    Object.entries(pos).forEach(([d, [x, y]]) => {
      const im = this.add.image(x, y, DIRS[d].tex).setAngle(DIRS[d].rot).setScale(0.75).setInteractive({ useHandCursor: true });
      im.on('pointerdown', () => {
        this.tweens.add({ targets: im, scale: 0.65, duration: 70, yoyo: true });
        this.addCmd(d);
      });
    });
    this.runBtn = button(this, 1090, 560, 200, 76, 'Chạy ▶', C.mint, () => this.run(), { size: 34 });
    button(this, 1090, 645, 160, 56, 'Xoá hết', C.grey, () => { if (!this.running) { this.prog = []; this.drawProgram(); } }, { size: 24 });
    this.bar = this.add.container(0, 0);
  }

  generate() {
    const cfg = this.cfg, n = cfg.size;
    for (let tries = 0; tries < 300; tries++) {
      let start, goal;
      if (cfg.straight) {
        const r = rnd(0, n - 1);
        start = [r, 0];
        goal = [r, rnd(n - 2, n - 1)];
      } else {
        start = [rnd(0, n - 1), rnd(0, n - 1)];
        goal = [rnd(0, n - 1), rnd(0, n - 1)];
        if (start[0] === goal[0] || start[1] === goal[1]) continue;
      }
      const blocked = new Set();
      const free = shuffle(Array.from({ length: n * n }, (_, k) => k)
        .filter((k) => k !== start[0] * n + start[1] && k !== goal[0] * n + goal[1]));
      free.slice(0, cfg.obstacles || 0).forEach((k) => blocked.add(k));
      const len = shortestLen(n, blocked, start, goal);
      if (len === Infinity || len < (cfg.minLen || 1)) continue;
      const runs = minRuns(n, blocked, start, goal);
      // Cấp cao cần đường đi phải rẽ nhiều lần; nới điều kiện ở các lần thử cuối để luôn có màn chơi.
      if (cfg.minRuns && runs < cfg.minRuns && tries < 250) continue;
      return { n, start, goal, blocked, runs };
    }
    return { n, start: [0, 0], goal: [n - 1, n - 1], blocked: new Set(), runs: 2 };
  }

  nextRound() {
    if (this.i >= this.n) return this.finish();
    this.setProgress(this.i, this.n);
    if (this.gridLayer) this.gridLayer.destroy();
    const lv = (this.lv = this.generate());
    this.maxBlocks = Math.min(10, lv.runs + (this.cfg.slack ?? 2));
    this.prog = [];
    const n = lv.n;
    this.cs = Math.min(84, 440 / n);
    const L = (this.gridLayer = this.add.container(0, 0));
    const g = this.add.graphics();
    L.add(g);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const { x, y } = this.cell(r, c);
        const s = this.cs - 6;
        g.fillStyle((r + c) % 2 ? 0xe9f7d8 : 0xf6fdeb, 1).fillRoundedRect(x - s / 2, y - s / 2, s, s, 10);
        g.lineStyle(2, 0xc5e3a5, 1).strokeRoundedRect(x - s / 2, y - s / 2, s, s, 10);
        if (lv.blocked.has(r * n + c)) L.add(fit(this.add.image(x, y, 'tree'), s * 0.9));
      }
    }
    const goal = this.cell(...lv.goal);
    const star = fit(this.add.image(goal.x, goal.y, 'staritem'), this.cs * 0.8);
    this.tweens.add({ targets: star, angle: 12, duration: 500, yoyo: true, repeat: -1 });
    L.add(star);
    const st = this.cell(...lv.start);
    this.robot = fit(this.add.image(st.x, st.y, 'robot'), this.cs * 0.9).setDepth(20);
    L.add(this.robot);
    this.robotPos = [...lv.start];
    this.drawProgram();
    this.mascot.say(this.cfg.slack === 0
      ? `Bé chỉ được dùng ${this.maxBlocks} lệnh! Bấm cùng một mũi tên nhiều lần để đi nhiều bước nhé!`
      : 'Bé bấm các mũi tên để xếp lệnh, rồi bấm Chạy để robot tới ngôi sao nhé!', { duration: 4500 });
  }

  cell(r, c) {
    const half = (this.lv.n * this.cs) / 2;
    return { x: GX - half + (c + 0.5) * this.cs, y: GY - half + (r + 0.5) * this.cs };
  }

  // Bấm cùng hướng với lệnh cuối thì gộp thành "×2, ×3…".
  addCmd(d) {
    if (this.running) return;
    const last = this.prog[this.prog.length - 1];
    if (last && last.d === d && last.k < 9) last.k++;
    else if (this.prog.length >= this.maxBlocks) {
      Audio.wrong();
      this.mascot.say(`Chỉ được ${this.maxBlocks} lệnh thôi, bé thử cách khác nhé!`, { duration: 2500 });
      return;
    } else this.prog.push({ d, k: 1 });
    Audio.tone(520, 0.06, { type: 'triangle', vol: 0.12 });
    this.drawProgram();
  }

  drawProgram() {
    this.bar.removeAll(true);
    const slots = this.maxBlocks;
    const gap = Math.min(86, 880 / slots);
    const x0 = 790 - ((slots - 1) * gap) / 2;
    this.bar.add(text(this, x0 - gap / 2 - 52, BAR_Y, 'Lệnh:', 28, INK));
    for (let k = 0; k < slots; k++) {
      const x = x0 + k * gap;
      const cmd = this.prog[k];
      const box = this.add.rectangle(x, BAR_Y, gap - 10, 72, cmd ? 0xffffff : 0xffffff, cmd ? 1 : 0.5).setStrokeStyle(3, cmd ? C.sky : 0xd9cfe0);
      this.bar.add(box);
      if (!cmd) continue;
      const im = this.add.image(x, BAR_Y - 4, DIRS[cmd.d].tex).setAngle(DIRS[cmd.d].rot).setScale(0.42);
      this.bar.add(im);
      if (cmd.k > 1) this.bar.add(text(this, x + gap / 2 - 22, BAR_Y + 22, `×${cmd.k}`, 22, '#e8638c'));
      box.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (this.running) return;
        this.prog.splice(k, 1);
        this.drawProgram();
      });
      cmd.box = box;
    }
  }

  run() {
    if (this.running || !this.prog.length) return;
    this.running = true;
    const steps = this.prog.flatMap((cmd) => Array.from({ length: cmd.k }, () => cmd));
    let s = 0;
    const tick = () => {
      if (s >= steps.length) return this.endRun();
      const cmd = steps[s++];
      this.prog.forEach((p) => p.box && p.box.setFillStyle(p === cmd ? 0xfff3cf : 0xffffff));
      const d = DIRS[cmd.d];
      const nr = this.robotPos[0] + d.dr, nc = this.robotPos[1] + d.dc;
      const n = this.lv.n;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n || this.lv.blocked.has(nr * n + nc)) {
        shake(this, this.robot);
        return this.fail('Ối, robot bị chặn rồi! Bé sửa lại các lệnh nhé!');
      }
      this.robotPos = [nr, nc];
      const p = this.cell(nr, nc);
      Audio.tone(440 + s * 20, 0.08, { type: 'triangle', vol: 0.12 });
      this.tweens.add({ targets: this.robot, x: p.x, y: p.y, duration: 240, ease: 'Quad.easeOut', onComplete: tick });
    };
    tick();
  }

  endRun() {
    const [gr, gc] = this.lv.goal;
    if (this.robotPos[0] === gr && this.robotPos[1] === gc) {
      this.good(this.robot.x, this.robot.y);
      this.mascot.say('Robot tới ngôi sao rồi! Bé lập trình giỏi quá!', { duration: 1800 });
      this.time.delayedCall(1500, () => { this.running = false; this.i++; this.nextRound(); });
    } else this.fail('Robot chưa tới ngôi sao, bé thêm hoặc sửa lệnh nhé!');
  }

  fail(hint) {
    this.bad(hint);
    this.time.delayedCall(900, () => {
      const st = this.cell(...this.lv.start);
      this.robotPos = [...this.lv.start];
      this.robot.setPosition(st.x, st.y);
      this.prog.forEach((p) => p.box && p.box.setFillStyle(0xffffff));
      this.running = false;
    });
  }
}
