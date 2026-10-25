import { W, C, INK } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, fit, burst, choiceCard, shake } from '../ui/helpers.js';
import Audio from '../core/AudioManager.js';
import { shuffle } from '../core/QuestionGenerator.js';

const CX = 520;
const CY = 385;
const PICS = ['strawberry', 'apple', 'fish', 'staritem', 'heart', 'flower'];
// Kích thước ô vuông lớn (hàng × cột) theo cỡ lưới.
const BOX = { 4: [2, 2], 6: [2, 3] };

// Đếm số lời giải (dừng ở 2) để chỉ giữ đề có đúng một lời giải.
function countSolutions(g, n, bh, bw, limit = 2) {
  const idx = g.indexOf(0);
  if (idx < 0) return 1;
  const r = Math.floor(idx / n), c = idx % n;
  let count = 0;
  for (let v = 1; v <= n && count < limit; v++) {
    let ok = true;
    for (let k = 0; k < n && ok; k++) if (g[r * n + k] === v || g[k * n + c] === v) ok = false;
    const r0 = r - (r % bh), c0 = c - (c % bw);
    for (let y = 0; y < bh && ok; y++) for (let x = 0; x < bw && ok; x++) if (g[(r0 + y) * n + c0 + x] === v) ok = false;
    if (!ok) continue;
    g[idx] = v;
    count += countSolutions(g, n, bh, bw, limit - count);
    g[idx] = 0;
  }
  return count;
}

// Lưới đầy đủ hợp lệ: dựng theo mẫu rồi xáo số, xáo hàng trong dải, xáo dải, xáo cột tương tự.
function solvedGrid(n) {
  const [bh, bw] = BOX[n];
  const digits = shuffle(Array.from({ length: n }, (_, k) => k + 1));
  const rows = shuffle([...Array(n / bh).keys()]).flatMap((b) => shuffle([...Array(bh).keys()]).map((r) => b * bh + r));
  const cols = shuffle([...Array(n / bw).keys()]).flatMap((b) => shuffle([...Array(bw).keys()]).map((c) => b * bw + c));
  const g = [];
  for (const r of rows) for (const c of cols) g.push(digits[(bw * (r % bh) + Math.floor(r / bh) + c) % n]);
  return g;
}

export function makeSudoku(n, blanks) {
  const [bh, bw] = BOX[n];
  const solution = solvedGrid(n);
  const puzzle = solution.slice();
  let removed = 0;
  for (const i of shuffle([...Array(n * n).keys()])) {
    if (removed >= blanks) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle.slice(), n, bh, bw) === 1) removed++;
    else puzzle[i] = keep;
  }
  return { solution, puzzle };
}

// Sudoku: chọn ô trống rồi chọn hình/số; mỗi hàng, mỗi cột, mỗi ô vuông lớn không được trùng.
export default class SudokuGame extends BaseMinigame {
  constructor() { super('sudoku'); }

  create() {
    this.setup();
    this.i = 0;
    this.n = this.cfg.rounds ?? 1;
    this.objs = [];
    this.nextRound();
  }

  symbol(v, x, y, size) {
    if (this.cfg.symbols === 'pics') return fit(this.add.image(x, y, PICS[v - 1]), size * 0.72);
    return text(this, x, y - 2, String(v), Math.round(size * 0.5), INK, { strokeThickness: 0 });
  }

  nextRound() {
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
    if (this.i >= this.n) return this.finish();
    this.setProgress(this.i, this.n);
    const n = (this.size = this.cfg.size);
    const [bh, bw] = BOX[n];
    const { solution, puzzle } = makeSudoku(n, this.cfg.blanks);
    this.solution = solution;
    this.grid = puzzle.slice();
    this.sel = null;
    const cs = (this.cs = n === 4 ? 104 : 78);
    const x0 = CX - (n * cs) / 2, y0 = CY - (n * cs) / 2;
    this.cells = [];
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), c = i % n;
      const x = x0 + c * cs + cs / 2, y = y0 + r * cs + cs / 2;
      const given = puzzle[i] !== 0;
      const bg = this.add.rectangle(x, y, cs - 4, cs - 4, given ? 0xf3ecff : 0xffffff).setStrokeStyle(2, 0xd9cfe0);
      this.objs.push(bg);
      const cell = { i, x, y, bg, given };
      if (given) this.objs.push(this.symbol(puzzle[i], x, y, cs));
      else bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.select(cell));
      this.cells.push(cell);
    }
    // Đường kẻ đậm quanh các ô vuông lớn
    const g = this.add.graphics();
    g.lineStyle(6, 0x7d5bd6, 1).strokeRect(x0, y0, n * cs, n * cs);
    for (let r = bh; r < n; r += bh) g.lineBetween(x0, y0 + r * cs, x0 + n * cs, y0 + r * cs);
    for (let c = bw; c < n; c += bw) g.lineBetween(x0 + c * cs, y0, x0 + c * cs, y0 + n * cs);
    this.objs.push(g);

    // Bảng chọn hình/số bên phải
    this.objs.push(text(this, 1040, 150, 'Chọn:', 30, '#8a5cd6'));
    for (let v = 1; v <= n; v++) {
      const x = 975 + ((v - 1) % 2) * 130, y = 230 + Math.floor((v - 1) / 2) * 120;
      const card = choiceCard(this, x, y, 110, 100, { color: C.purple });
      card.add(this.symbol(v, 0, 0, 100));
      card.on('pointerdown', () => this.place(v, card));
      this.objs.push(card);
    }
    this.mascot.say(this.cfg.symbols === 'pics'
      ? 'Mỗi hàng, mỗi cột và mỗi ô vuông lớn có đủ các hình, không trùng nhau. Bé chạm ô trống rồi chọn hình nhé!'
      : 'Mỗi hàng, mỗi cột và mỗi ô vuông lớn có đủ các số, không trùng nhau. Bé chạm ô trống rồi chọn số nhé!');
  }

  select(cell) {
    if (this.grid[cell.i]) return;
    if (this.sel) this.sel.bg.setFillStyle(0xffffff);
    this.sel = cell;
    cell.bg.setFillStyle(0xfff3cf);
    Audio.pop();
  }

  place(v, card) {
    if (!this.sel) { this.mascot.say('Bé chạm vào một ô trống trước nhé!', { duration: 2000 }); return; }
    const cell = this.sel;
    if (this.solution[cell.i] === v) {
      this.grid[cell.i] = v;
      cell.bg.setFillStyle(0xdcfbea).disableInteractive();
      this.objs.push(this.symbol(v, cell.x, cell.y, this.cs));
      this.sel = null;
      this.good();
      if (this.grid.every((x) => x)) {
        this.time.delayedCall(300, () => { burst(this, CX, CY, 30); Audio.win(); });
        this.time.delayedCall(1600, () => { this.i++; this.nextRound(); });
      }
    } else {
      shake(this, card);
      cell.bg.setFillStyle(0xffd0d0);
      this.time.delayedCall(450, () => { if (!this.grid[cell.i]) cell.bg.setFillStyle(this.sel === cell ? 0xfff3cf : 0xffffff); });
      this.bad('Hàng, cột hoặc ô vuông lớn đã có cái này rồi, bé thử lại nhé!');
    }
  }
}
