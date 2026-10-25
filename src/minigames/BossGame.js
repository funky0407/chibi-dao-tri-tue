import { C } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, choiceCard, shake, fit, burst, confetti } from '../ui/helpers.js';
import { chibiImage, ensureChibi } from '../art/svg.js';
import Save from '../core/SaveManager.js';
import Audio from '../core/AudioManager.js';
import { rnd, pick, shuffle, numberChoices, patternRound, othersFrom, numberSeq, mathQuestion } from '../core/QuestionGenerator.js';
import { clockFace, timeLabel, randomTime, clockChoices } from '../ui/Clock.js';

const QX = 580;
const BOSS = { x: 960, y: 210, s: 0.9 };
const KID = { x: 220, y: 330 };

// Trận cuối đảo: mỗi câu đúng bắn một ngôi sao vào Quái Mây Đen.
export default class BossGame extends BaseMinigame {
  constructor() { super('boss'); }

  create() {
    this.setup({ bg: 'bg_stage' });
    this.titleText.setColor('#ffffff').setStroke('#5a4aa0', 8);
    this.hp = this.cfg.hp;
    this.qi = 0;
    this.types = shuffle(this.cfg.types.slice());

    this.art = this.cfg.art || 'boss';
    this.boss = this.add.image(BOSS.x, BOSS.y, this.art).setScale(BOSS.s);
    this.tweens.add({ targets: this.boss, y: BOSS.y - 14, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.hearts = Array.from({ length: this.hp }, (_, k) => {
      const h = this.add.image(BOSS.x + (k - (this.hp - 1) / 2) * 54, 345, 'heart');
      return fit(h, 48);
    });
    this.kid = chibiImage(this, KID.x, KID.y, Save.player, 'normal').setScale(0.65);

    this.mascot.say(this.cfg.intro || 'Quái Mây Đen che mất mặt trời rồi! Bé trả lời đúng để đánh bại nó nhé!');
    this.time.delayedCall(1800, () => this.nextQuestion());
  }

  nextQuestion() {
    if (this.L) this.L.destroy();
    const L = (this.L = this.add.container(0, 0));
    const type = this.types[this.qi++ % this.types.length];
    const q = this[`q_${type}`](L);
    L.add(text(this, QX, 420, q.prompt, 42, '#ffffff', { stroke: '#5a4aa0', strokeThickness: 8 }));
    this.mascot.say(q.prompt, { speech: q.speech, duration: 3000 });
    if (q.english) this.time.delayedCall(1600, () => Audio.speak(q.english, 'en-US'));

    const cw = q.cardW || 180;
    q.choices.forEach((o, k) => {
      const isImg = !!o.image;
      const card = choiceCard(this, QX + (k - 1) * Math.max(210, cw + 25), 545, isImg ? 160 : cw, isImg ? 140 : 120, {
        label: o.label, image: o.image, color: C.yellow, imageSize: 100, size: q.size,
      });
      L.add(card);
      card.on('pointerdown', () => {
        if (this.locked || card.disabled) return;
        if (o.value === q.answer) {
          this.locked = true;
          card.mark('right');
          this.attack();
        } else {
          card.disabled = true;
          card.mark('wrong');
          shake(this, card);
          this.tweens.add({ targets: this.boss, scaleX: BOSS.s * 1.1, scaleY: BOSS.s * 0.92, duration: 120, yoyo: true, repeat: 1 });
          this.bad(q.hint);
        }
      });
    });
  }

  q_add(L) {
    const a = rnd(1, 6), b = rnd(1, 9 - a);
    L.add(text(this, QX, 250, `${a} + ${b} = ?`, 90, '#ffd166', { stroke: '#5a4aa0', strokeThickness: 12 }));
    return {
      prompt: 'Bé tính nhé!', speech: `${a} cộng ${b} bằng mấy?`, answer: a + b, hint: 'Bé đếm thêm từng số nhé!',
      choices: numberChoices(a + b, 3, 0, 10).map((v) => ({ label: v, value: v })),
    };
  }

  q_count(L) {
    const n = rnd(3, 8);
    const key = pick(this.cfg.pool);
    for (let k = 0; k < n; k++) {
      const im = this.add.image(QX + (k - (n - 1) / 2) * 66, 260, key);
      L.add(fit(im, 60));
    }
    return {
      prompt: 'Có bao nhiêu hình?', answer: n, hint: 'Bé đếm thật chậm nhé!',
      choices: numberChoices(n, 3, 1, 10).map((v) => ({ label: v, value: v })),
    };
  }

  q_word(L) {
    const w = pick(this.cfg.words);
    L.add(this.add.circle(QX, 250, 100, 0xffffff, 0.9));
    L.add(fit(this.add.image(QX, 250, w.item), 160));
    const opts = shuffle([w, ...othersFrom(this.cfg.words, w, 2)]);
    return {
      prompt: 'Đây là con gì, cái gì?', answer: w.w, hint: 'Bé đọc thật kỹ từng chữ nhé!',
      choices: opts.map((o) => ({ label: o.w, value: o.w })),
    };
  }

  q_english(L) {
    const w = pick(this.cfg.english);
    L.add(text(this, QX, 250, w.w, 96, '#8ee3c8', { stroke: '#5a4aa0', strokeThickness: 12 }));
    const opts = shuffle([w, ...othersFrom(this.cfg.english, w, 2)]);
    return {
      prompt: 'Hình nào đúng với từ này?', english: w.w, answer: w.item, hint: 'Bé nghe lại từ tiếng Anh nhé!',
      choices: opts.map((o) => ({ image: o.item, value: o.item })),
    };
  }

  q_pattern(L) {
    const q = patternRound('AB', this.cfg.pool, true);
    q.seq.forEach((key, k) => {
      const x = QX + (k - (q.seq.length - 1) / 2) * 70;
      if (k === q.hide) L.add(text(this, x, 255, '?', 64, '#ffd166', { stroke: '#5a4aa0', strokeThickness: 10 }));
      else L.add(fit(this.add.image(x, 255, key), 60));
    });
    return {
      prompt: 'Hình nào còn thiếu?', answer: q.answer, hint: 'Các hình lặp lại theo cặp đó!',
      choices: q.choices.map((c) => ({ image: c, value: c })),
    };
  }

  // ---------- Câu hỏi Đảo 3–5 ----------

  // Toán theo cấu hình cfg.math (dùng chung bộ sinh câu hỏi với trò Toán).
  q_math(L) {
    const cfg = this.cfg.math;
    const q = mathQuestion(pick(cfg.kinds), cfg);
    const long = q.prompt.length > 16;
    L.add(text(this, QX, 250, q.prompt, long ? 30 : 80, '#ffd166', { stroke: '#5a4aa0', strokeThickness: long ? 6 : 12, wordWrap: { width: 440 } }));
    let choices = q.choices;
    if (!choices) {
      const set = new Set([q.answer]);
      (q.wrongs || []).forEach((w) => { if (set.size < 3 && w > 0) set.add(w); });
      numberChoices(q.answer, 6, 0, Math.max(10, q.answer + 10)).forEach((v) => { if (set.size < 3) set.add(v); });
      choices = shuffle([...set]);
    }
    return {
      prompt: 'Bé tính nhé!', speech: q.speech || q.prompt, answer: q.answer, hint: 'Bé tính lại thật cẩn thận nhé!',
      size: choices.some((v) => String(v).length > 4) ? 40 : undefined,
      choices: choices.map((v) => ({ label: v, value: v })),
    };
  }

  // Cặp từ: cho vế đầu, chọn vế còn lại (từ trái nghĩa, vế tục ngữ...).
  q_pair(L) {
    const p = pick(this.cfg.pairs);
    L.add(text(this, QX, 250, p.q, p.q.length > 10 ? 50 : 76, '#ffd166', { stroke: '#5a4aa0', strokeThickness: 10, wordWrap: { width: 460 } }));
    const opts = shuffle([p, ...othersFrom(this.cfg.pairs, p, 2)]);
    const long = opts.some((o) => o.a.length > 8);
    return {
      prompt: this.cfg.pairPrompt || 'Chọn từ trái nghĩa nhé!', answer: p.a, hint: 'Bé đọc thật kỹ rồi chọn lại nhé!',
      cardW: long ? 250 : 180, size: long ? 26 : 40,
      choices: opts.map((o) => ({ label: o.a, value: o.a })),
    };
  }

  // ---------- Câu hỏi Lớp 2 ----------

  q_mul(L) {
    const a = pick(this.cfg.mulTables || [2, 5]), b = rnd(2, 10);
    L.add(text(this, QX, 250, `${a} × ${b} = ?`, 90, '#ffd166', { stroke: '#5a4aa0', strokeThickness: 12 }));
    return {
      prompt: 'Bé tính nhé!', speech: `${a} nhân ${b} bằng mấy?`, answer: a * b, hint: `Bé đọc lại bảng nhân ${a} nhé!`,
      choices: numberChoices(a * b, 3, 0, 60).map((v) => ({ label: v, value: v })),
    };
  }

  q_clock(L) {
    const t = randomTime(15);
    L.add(clockFace(this, QX, 245, 95, t.h, t.m));
    return {
      prompt: 'Đồng hồ chỉ mấy giờ?', answer: t, hint: 'Kim ngắn chỉ giờ, kim dài chỉ phút nhé!', cardW: 230, size: 26,
      choices: clockChoices(t, 3, 15).map((c) => ({ label: timeLabel(c), value: c })),
    };
  }

  q_spell(L) {
    const w = pick(this.cfg.spell);
    L.add(this.add.circle(QX - 110, 250, 80, 0xffffff, 0.9));
    L.add(fit(this.add.image(QX - 110, 250, w.item), 130));
    L.add(text(this, QX + 90, 250, w.shown, 72, '#ffd166', { stroke: '#5a4aa0', strokeThickness: 12 }));
    return {
      prompt: 'Chọn chữ còn thiếu nhé!', speech: `${w.say}. Chọn chữ còn thiếu nhé!`, answer: w.answer, hint: 'Bé đọc thật kỹ tên của hình nhé!',
      choices: shuffle([w.answer, ...w.options]).map((o) => ({ label: o, value: o })),
    };
  }

  q_color(L) {
    const c = pick(this.cfg.colors);
    L.add(this.add.circle(QX, 250, 75, Phaser.Display.Color.HexStringToColor(c.color).color).setStrokeStyle(8, 0xffffff));
    const opts = shuffle([c, ...othersFrom(this.cfg.colors, c, 2)]);
    return {
      prompt: 'Màu này tiếng Anh là gì?', answer: c.w, hint: 'Bé nhớ lại tên các màu bằng tiếng Anh nhé!', size: 46,
      choices: opts.map((o) => ({ label: o.w, value: o.w })),
    };
  }

  q_seq(L) {
    const q = numberSeq({ seqKinds: ['up', 'down'], steps: [2, 5, 10], startMax: 20, len: 5 }, true);
    q.seq.forEach((v, k) => {
      const x = QX + (k - (q.seq.length - 1) / 2) * 92;
      L.add(text(this, x, 255, k === q.hide ? '?' : String(v), 52, '#ffd166', { stroke: '#5a4aa0', strokeThickness: 10 }));
    });
    return {
      prompt: 'Số nào còn thiếu?', answer: q.answer, hint: 'Bé xem mỗi lần tăng hay giảm mấy nhé!',
      choices: q.choices.map((v) => ({ label: v, value: v })),
    };
  }

  attack() {
    this.good(undefined, undefined, { sound: false });
    Audio.pop();
    const shot = this.add.image(KID.x + 40, KID.y - 40, 'staritem').setDepth(80);
    fit(shot, 70);
    this.tweens.add({
      targets: shot, x: this.boss.x, y: this.boss.y, angle: 720, duration: 520, ease: 'Quad.easeIn',
      onComplete: () => {
        shot.destroy();
        Audio.correct();
        burst(this, this.boss.x, this.boss.y, 20);
        this.boss.setTintFill(0xffffff);
        this.time.delayedCall(90, () => this.boss.clearTint());
        shake(this, this.boss);
        this.hp--;
        const h = this.hearts[this.hp];
        this.tweens.add({ targets: h, scale: 0, angle: 90, duration: 300, ease: 'Back.easeIn' });
        if (this.hp <= 0) this.defeat();
        else this.time.delayedCall(900, () => { this.locked = false; this.nextQuestion(); });
      },
    });
  }

  defeat() {
    this.time.delayedCall(400, () => {
      if (this.L) this.L.destroy();
      this.tweens.killTweensOf(this.boss);
      this.boss.setTexture(`${this.art}_happy`).setScale(0.5);
      this.tweens.add({ targets: this.boss, scale: BOSS.s, duration: 500, ease: 'Back.easeOut' });
      ensureChibi(this.textures, Save.player, 'happy').then((k) => { if (this.kid.scene) this.kid.setTexture(k); });
      this.tweens.add({ targets: this.kid, y: KID.y - 40, duration: 300, yoyo: true, repeat: 3 });
      text(this, QX, 470, 'Bé thắng rồi!', 80, '#ffd166', { stroke: '#5a4aa0', strokeThickness: 12 });
      confetti(this);
      Audio.win();
      this.mascot.say(this.cfg.outro || 'Hoan hô! Mặt trời đã trở lại rồi!');
      this.time.delayedCall(2600, () => this.finish());
    });
  }
}
