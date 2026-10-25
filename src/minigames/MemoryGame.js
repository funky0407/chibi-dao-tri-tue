import { W, C, INK } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, fit, burst } from '../ui/helpers.js';
import Audio from '../core/AudioManager.js';
import { rnd, shuffle } from '../core/QuestionGenerator.js';

// Số cột × hàng theo số thẻ.
const GRID = { 4: [2, 2], 6: [3, 2], 8: [4, 2], 10: [5, 2], 12: [4, 3], 16: [4, 4] };
const CX = W / 2 + 60;
const CY = 375;

// Lật thẻ trí nhớ. Mỗi cặp có 2 mặt: giống hệt nhau (same), hình ↔ chữ (word / english), phép tính ↔ kết quả (math).
export default class MemoryGame extends BaseMinigame {
  constructor() { super('memory'); }

  create() {
    this.setup();
    this.open = [];
    this.matched = 0;
    this.misses = 0;
    this.pairs = this.makePairs();
    const faces = shuffle(this.pairs.flatMap((p, k) => [{ ...p[0], key: k }, { ...p[1], key: k }]));
    const [cols, rows] = GRID[faces.length] || [4, Math.ceil(faces.length / 4)];
    const cw = Math.min(150, 900 / cols - 16);
    const ch = Math.min(150, 450 / rows - 14);
    this.cards = faces.map((f, i) => {
      const x = CX + ((i % cols) - (cols - 1) / 2) * (cw + 16);
      const y = CY + (Math.floor(i / cols) - (rows - 1) / 2) * (ch + 14);
      return this.makeCard(f, x, y, cw, ch);
    });

    const peek = this.cfg.peek || 0;
    if (peek) {
      this.locked = true;
      this.cards.forEach((c) => this.show(c, true, false));
      this.mascot.say('Bé nhìn kỹ và nhớ vị trí các thẻ nhé!', { duration: peek });
      this.time.delayedCall(peek, () => {
        this.cards.forEach((c) => this.show(c, false));
        this.locked = false;
        this.mascot.say('Giờ bé lật hai thẻ giống nhau nhé!');
      });
    } else {
      this.mascot.say(this.cfg.mode === 'math' ? 'Bé lật thẻ phép tính và thẻ kết quả đúng của nó nhé!' : 'Bé lật hai thẻ thành một cặp nhé!');
    }
  }

  makePairs() {
    const { mode, pairs } = this.cfg;
    if (mode === 'math') {
      const seen = new Set();
      const out = [];
      while (out.length < pairs) {
        const max = this.cfg.max ?? 10;
        const add = Math.random() < 0.5;
        const a = rnd(1, max - 1), b = add ? rnd(1, max - a) : rnd(1, a);
        const r = add ? a + b : a - b;
        if (seen.has(r)) continue;
        seen.add(r);
        out.push([{ label: `${a} ${add ? '+' : '−'} ${b}` }, { label: String(r), big: true }]);
      }
      return out;
    }
    if (mode === 'mul') {
      // Phép nhân ↔ tích, các tích không trùng nhau.
      const seen = new Set();
      const out = [];
      for (let g = 0; out.length < pairs && g < 200; g++) {
        const a = this.cfg.tables[rnd(0, this.cfg.tables.length - 1)], b = rnd(2, 9);
        if (seen.has(a * b)) continue;
        seen.add(a * b);
        out.push([{ label: `${a} × ${b}` }, { label: String(a * b), big: true }]);
      }
      return out;
    }
    if (mode === 'pairs') {
      // Cặp chữ cho sẵn: từ trái nghĩa, phân số ↔ số thập phân, vế tục ngữ...
      return shuffle(this.cfg.list.slice()).slice(0, pairs).map((p) => [{ label: p.a }, { label: p.b }]);
    }
    if (mode === 'word' || mode === 'english') {
      const list = this.cfg[mode === 'word' ? 'words' : 'english'];
      return shuffle(list.slice()).slice(0, pairs).map((w) => [{ image: w.item }, { label: w.w, big: true }]);
    }
    return shuffle(this.cfg.pool.slice()).slice(0, pairs).map((key) => [{ image: key }, { image: key }]);
  }

  makeCard(f, x, y, w, h) {
    const c = this.add.container(x, y);
    const back = this.add.graphics();
    back.fillStyle(0x7d5bd6, 1).fillRoundedRect(-w / 2, -h / 2 + 6, w, h, 18);
    back.fillStyle(C.purple, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    back.lineStyle(4, 0xffffff, 0.8).strokeRoundedRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 12);
    const q = text(this, 0, -2, '?', Math.min(w, h) * 0.5, '#ffffff', { stroke: '#7d5bd6', strokeThickness: 8 });
    const front = this.add.container(0, 0);
    const fg = this.add.graphics();
    front.add(fg);
    const drawFront = (border) => {
      fg.clear();
      fg.fillStyle(0xffffff, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 18);
      fg.lineStyle(5, border, 1).strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 16);
    };
    drawFront(C.sky);
    if (f.image) front.add(fit(this.add.image(0, 0, f.image), Math.min(w, h) * 0.78));
    else if (f.label.length > 9) {
      // Chữ dài (vế tục ngữ, từ ghép) thì xuống dòng thay vì thu nhỏ quá mức.
      front.add(text(this, 0, -2, f.label, Math.round(Math.min(24, h * 0.2)), INK, { strokeThickness: 0, wordWrap: { width: w - 16 } }));
    } else {
      const size = f.big && f.label.length <= 3 ? Math.min(w, h) * 0.42 : Math.min(w / (f.label.length * 0.55), h * 0.32);
      front.add(text(this, 0, -2, f.label, Math.round(size), INK, { strokeThickness: 0 }));
    }
    c.add([back, q, front]);
    c.back = [back, q];
    c.front = front;
    c.drawFront = drawFront;
    c.key = f.key;
    c.faceUp = false;
    front.setVisible(false);
    c.setSize(w, h).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => this.tap(c));
    return c;
  }

  // Lật thẻ (có hiệu ứng thu hẹp – mở rộng).
  show(c, up, animate = true) {
    c.faceUp = up;
    const swap = () => { c.front.setVisible(up); c.back.forEach((o) => o.setVisible(!up)); };
    if (!animate) { swap(); return; }
    this.tweens.add({ targets: c, scaleX: 0, duration: 110, onComplete: () => { swap(); this.tweens.add({ targets: c, scaleX: 1, duration: 110 }); } });
  }

  tap(c) {
    if (this.locked || c.faceUp || c.done || this.open.length >= 2) return;
    Audio.tone(560, 0.06, { type: 'triangle', vol: 0.12 });
    this.show(c, true);
    this.open.push(c);
    if (this.open.length < 2) return;
    const [a, b] = this.open;
    if (a.key === b.key) {
      a.done = b.done = true;
      this.open = [];
      this.time.delayedCall(250, () => {
        a.drawFront(C.mint);
        b.drawFront(C.mint);
        this.good();
        burst(this, (a.x + b.x) / 2, (a.y + b.y) / 2, 14);
        if (++this.matched === this.pairs.length) this.allMatched();
      });
    } else {
      this.misses++;
      // Lật nhầm là chuyện bình thường của trò trí nhớ nên không gọi chú cún.
      this.bad(null, { sound: false, dog: false });
      this.time.delayedCall(850, () => {
        this.show(a, false);
        this.show(b, false);
        this.open = [];
      });
    }
  }

  allMatched() {
    const n = this.pairs.length;
    const stars = this.misses <= Math.ceil(n * 0.5) ? 3 : this.misses <= Math.ceil(n * 1.5) ? 2 : 1;
    this.mascot.say('Bé nhớ giỏi quá!');
    this.time.delayedCall(700, () => this.finish(stars));
  }
}
