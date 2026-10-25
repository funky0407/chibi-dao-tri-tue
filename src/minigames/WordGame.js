import { W, C, INK } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, shake, fit, burst } from '../ui/helpers.js';
import Audio from '../core/AudioManager.js';
import { shuffle, wordDistractors } from '../core/QuestionGenerator.js';

const SLOT_Y = 425;
const TILE_Y = 580;
const GAP = 18;

// Kéo (hoặc chạm) chữ vào ô. Ba chế độ:
// - mặc định: ghép cả từ từ các ô chữ
// - "fill": các ô đã có sẵn chữ, chỉ điền ô trống (w.blank) — dùng cho chính tả âm đầu / vần
// - "sentence": mỗi ô là một tiếng, xếp thành câu
export default class WordGame extends BaseMinigame {
  constructor() { super('word'); }

  create() {
    this.setup();
    this.mode = this.cfg.mode || 'word';
    // Ô là cả một từ (câu) thì nối bằng dấu cách; "fill" với sep = " " là điền từ còn thiếu trong câu.
    this.sep = this.cfg.sep ?? (this.mode === 'sentence' ? ' ' : '');
    this.fontSize = this.sep ? 50 : 64;
    this.words = shuffle(this.cfg.words.slice()).slice(0, this.cfg.rounds);
    this.i = 0;
    this.objs = [];
    this.input.on('dragstart', (p, obj) => { obj.setDepth(50); obj.startX = obj.x; obj.startY = obj.y; });
    this.input.on('drag', (p, obj, x, y) => { obj.x = x; obj.y = y; });
    this.input.on('dragend', (p, obj) => this.drop(obj));
    this.nextRound();
  }

  // Chiều rộng ô vừa với chữ (chữ ghép như "ngh", "uyên" hay một tiếng trong câu).
  widthOf(str) {
    const t = text(this, 0, 0, str, this.fontSize, INK);
    const w = Math.max(104, t.width + 30);
    t.destroy();
    return w;
  }

  // Toạ độ tâm của một hàng ô, căn giữa quanh cx; thu nhỏ nếu quá rộng.
  row(widths, cx, maxW = 1080) {
    const total = widths.reduce((s, w) => s + w, 0) + GAP * (widths.length - 1);
    const scale = Math.min(1, maxW / total);
    let x = cx - (total * scale) / 2;
    return widths.map((w) => { const c = x + (w * scale) / 2; x += (w + GAP) * scale; return { x: c, scale }; });
  }

  nextRound() {
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
    if (this.i >= this.words.length) return this.finish();
    this.setProgress(this.i, this.words.length);
    const w = (this.word = this.words[this.i]);
    const add = (o) => { this.objs.push(o); return o; };

    add(this.add.circle(W / 2, 240, 120, 0xffffff, 0.85).setStrokeStyle(6, C.yellow));
    this.pic = add(this.add.image(W / 2, 240, w.item || 'book'));
    fit(this.pic, 190);

    const blanks = this.mode === 'fill' ? (w.blank || [0]) : w.tiles.map((_, k) => k);
    const widths = w.tiles.map((t) => this.widthOf(t));
    this.slots = this.row(widths, W / 2).map(({ x, scale }, k) => {
      const sw = widths[k] * scale, sh = 116 * Math.min(1, scale + 0.15);
      const filled = !blanks.includes(k);
      const g = add(this.add.graphics());
      g.fillStyle(filled ? 0xfff3cf : 0xffffff, filled ? 1 : 0.75).fillRoundedRect(x - sw / 2, SLOT_Y - sh / 2, sw, sh, 22);
      g.lineStyle(5, 0xe0a62a, 1).strokeRoundedRect(x - sw / 2, SLOT_Y - sh / 2, sw, sh, 22);
      if (filled) add(text(this, x, SLOT_Y - 4, w.tiles[k], this.fontSize * Math.min(1, scale + 0.1), INK));
      return { x, y: SLOT_Y, letter: w.tiles[k], filled };
    });

    const needed = blanks.map((k) => w.tiles[k]);
    const extra = this.mode === 'fill' ? (w.options || []) : wordDistractors(w.tiles, this.cfg);
    const pool = shuffle(needed.concat(extra));
    const tw = pool.map((t) => this.widthOf(t));
    this.row(tw, W / 2 + 60, 1020).forEach(({ x, scale }, k) => add(this.makeTile(pool[k], tw[k], x, TILE_Y, scale)));

    const name = this.cfg.sayWord === false ? 'Đây là gì nhỉ?' : `Đây là ${w.say}.`;
    // Chính tả: chỉ đọc to tên hình, không viết ra để khỏi lộ đáp án.
    if (this.mode === 'fill' && this.sep) this.mascot.say('Bé chọn từ còn thiếu để câu đúng và hay nhé!');
    else if (this.mode === 'fill') this.mascot.say('Đây là gì nhỉ? Bé chọn chữ còn thiếu nhé!', { speech: `${w.say}. Bé chọn chữ còn thiếu nhé!` });
    else if (this.mode === 'sentence') this.mascot.say('Bé xếp các từ thành câu đúng nhé!');
    else this.mascot.say(`${name} Bé hãy ghép chữ nhé!`);
  }

  makeTile(letter, width, x, y, scale = 1) {
    const c = this.add.container(x, y).setDepth(10).setScale(scale);
    const g = this.add.graphics();
    g.fillStyle(0xe0a62a, 1).fillRoundedRect(-width / 2, -46, width, 104, 22);
    g.fillStyle(0xffd166, 1).fillRoundedRect(-width / 2, -52, width, 104, 22);
    g.fillStyle(0xffffff, 0.35).fillRoundedRect(-width / 2 + 10, -46, width - 20, 24, 12);
    c.add([g, text(this, 0, -4, letter, this.fontSize, INK)]);
    c.setSize(width, 104).setInteractive({ useHandCursor: true, draggable: true });
    c.letter = letter;
    c.homeX = x;
    c.homeY = y;
    c.homeScale = scale;
    return c;
  }

  drop(tile) {
    tile.setDepth(10);
    const moved = Phaser.Math.Distance.Between(tile.x, tile.y, tile.startX, tile.startY);
    const empty = this.slots.filter((s) => !s.filled);
    let slot;
    if (moved < 15) slot = empty[0];
    else {
      slot = empty
        .map((s) => ({ s, d: Phaser.Math.Distance.Between(tile.x, tile.y, s.x, s.y) }))
        .filter((o) => o.d < 95)
        .sort((a, b) => a.d - b.d)[0]?.s;
    }
    if (!slot) return this.sendHome(tile);
    if (slot.letter === tile.letter) {
      slot.filled = true;
      tile.disableInteractive();
      this.tweens.add({ targets: tile, x: slot.x, y: slot.y, duration: 160, ease: 'Back.easeOut' });
      this.good();
      if (this.slots.every((s) => s.filled)) this.wordDone();
    } else {
      this.sendHome(tile);
      this.time.delayedCall(220, () => shake(this, tile));
      this.bad(this.mode === 'sentence' ? 'Từ này chưa đúng chỗ, bé đọc lại câu nhé!' : 'Chữ này chưa đúng chỗ, bé thử lại nhé!');
    }
  }

  sendHome(tile) {
    this.tweens.add({ targets: tile, x: tile.homeX, y: tile.homeY, duration: 200, ease: 'Cubic.easeOut' });
  }

  wordDone() {
    const word = this.word.tiles.join(this.sep);
    this.objs.forEach((o) => { if (o.letter && o.input && o.input.enabled) this.tweens.add({ targets: o, alpha: 0, duration: 200 }); });
    this.time.delayedCall(250, () => {
      Audio.speak(word);
      burst(this, W / 2, 240, 24);
      this.tweens.add({ targets: this.pic, y: 210, duration: 200, yoyo: true, repeat: 1 });
    });
    this.time.delayedCall(1500, () => { this.i++; this.nextRound(); });
  }
}
