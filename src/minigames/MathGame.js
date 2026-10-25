import { W, C } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, panel, choiceCard, shake, fit } from '../ui/helpers.js';
import Audio from '../core/AudioManager.js';
import { mathQuestion, numberChoices, shuffle } from '../core/QuestionGenerator.js';

const HINTS = {
  count: 'Bé chạm vào từng quả để đếm nhé!',
  add: 'Bé đếm thêm từ số thứ nhất nhé!',
  sub: 'Bé đếm lùi từ số thứ nhất nhé!',
  missing: 'Bé thử từng số xem cộng vào có đúng không nhé!',
  chain: 'Bé tính lần lượt từ trái sang phải nhé!',
  mul: 'Bé đọc lại bảng nhân nhé!',
  div: 'Bé nghĩ xem số chia nhân với mấy thì ra số bị chia nhé!',
  mulmissing: 'Bé đọc lại bảng nhân để tìm số còn thiếu nhé!',
  mixmul: 'Bé làm phép nhân trước, rồi cộng sau nhé!',
  mulBig: 'Bé nhân lần lượt từ hàng đơn vị nhé!',
  divBig: 'Bé chia lần lượt từ hàng cao nhất nhé!',
  perimeter: 'Chu vi là tổng độ dài các cạnh đó!',
  mul2: 'Bé nhân với từng chữ số rồi cộng lại nhé!',
  avg: 'Bé cộng ba số lại rồi chia cho 3 nhé!',
  fracAdd: 'Cùng mẫu số thì bé chỉ cộng tử số thôi!',
  fracSub: 'Cùng mẫu số thì bé chỉ trừ tử số thôi!',
  fracOf: 'Bé chia cho mẫu số rồi nhân với tử số nhé!',
  decAdd: 'Bé đặt dấu phẩy thẳng cột rồi cộng nhé!',
  decSub: 'Bé đặt dấu phẩy thẳng cột rồi trừ nhé!',
  decMul10: 'Nhân với 10 thì dời dấu phẩy sang phải một chữ số đó!',
  percent: 'Bé chia cho 100 rồi nhân với số phần trăm nhé!',
  area: 'Tam giác: đáy nhân cao chia 2; hình chữ nhật: dài nhân rộng!',
  speed: 'Vận tốc bằng quãng đường chia cho thời gian đó!',
};

export default class MathGame extends BaseMinigame {
  constructor() { super('math'); }

  create() {
    this.setup();
    this.i = 0;
    this.n = this.cfg.rounds;
    this.nextRound();
  }

  nextRound() {
    if (this.i >= this.n) return this.finish();
    this.setProgress(this.i, this.n);
    if (this.L) this.L.destroy();
    const L = (this.L = this.add.container(0, 0));
    const q = mathQuestion(this.cfg.kinds[this.i % this.cfg.kinds.length], this.cfg);
    // Số nhỏ thì vẽ hình để bé đếm; số lớn chỉ hiện phép tính.
    const pictures = q.kind === 'count' || ((q.kind === 'add' || q.kind === 'sub') && (this.cfg.max ?? 10) <= 10);

    L.add(panel(this, W / 2, 300, 940, 300, 0xffffff, 0.85));
    if (pictures) {
      L.add(text(this, W / 2, 125, q.prompt, q.kind === 'count' ? 52 : 68, q.kind === 'count' ? '#8a5cd6' : '#ff5f93'));
    } else {
      L.add(text(this, W / 2, 125, 'Bé tính nhẩm nhé!', 52, '#8a5cd6'));
      // Phép tính ngắn thì chữ to; bài toán có lời văn thì chữ vừa và xuống dòng.
      const len = q.prompt.length;
      const size = len <= 16 ? 110 : len <= 24 ? 80 : 44;
      L.add(text(this, W / 2, 300, q.prompt, size, size < 60 ? '#5b3a5e' : '#ff5f93', { strokeThickness: size < 60 ? 6 : 14, wordWrap: { width: 860 } }));
    }
    this.mascot.say(q.kind === 'count' ? 'Có bao nhiêu quả? Bé đếm nhé!' : q.prompt, { speech: q.speech, duration: 3000 });

    if (q.kind === 'count') this.drawCount(L, q);
    else if (pictures && q.kind === 'add') {
      this.drawGroup(L, W / 2 - 240, 300, q.a, q.item);
      L.add(text(this, W / 2, 300, '+', 90, '#ff5f93'));
      this.drawGroup(L, W / 2 + 240, 300, q.b, q.item);
    } else if (pictures) {
      const items = this.drawGroup(L, W / 2, 300, q.a, q.item, 5, 90);
      items.slice(q.a - q.b).forEach((it, k) => {
        this.tweens.add({ targets: it, alpha: 0.22, y: it.y - 16, delay: 700 + k * 120, duration: 300 });
      });
    }

    this.choicesFor(q).forEach((v, k) => {
      const lab = String(v);
      const card = choiceCard(this, W / 2 + 60 + (k - 1) * 230, 530, 190, 130, { label: v, color: C.pink, size: lab.length > 5 ? 40 : lab.length > 3 ? 52 : 65 });
      L.add(card);
      card.on('pointerdown', () => {
        if (this.locked || card.disabled) return;
        if (v === q.answer) {
          this.locked = true;
          card.mark('right');
          this.good(card.x, card.y);
          this.time.delayedCall(1000, () => { this.locked = false; this.i++; this.nextRound(); });
        } else {
          card.disabled = true;
          card.mark('wrong');
          shake(this, card);
          this.bad(HINTS[q.kind]);
        }
      });
    });
  }

  // Đáp án chữ (phân số, thập phân) có sẵn; đáp án số ưu tiên các lỗi hay gặp (wrongs) rồi thêm số gần đúng.
  choicesFor(q) {
    if (q.choices) return q.choices;
    const min = q.kind === 'count' ? 1 : 0;
    const max = Math.max(10, this.cfg.max ?? 0, q.answer + 10);
    if (!q.wrongs) return numberChoices(q.answer, 3, min, max);
    const set = new Set([q.answer]);
    q.wrongs.forEach((w) => { if (set.size < 3 && w > 0) set.add(w); });
    numberChoices(q.answer, 6, min, max).forEach((v) => { if (set.size < 3) set.add(v); });
    return shuffle([...set]);
  }

  // Lưới đồ vật; chạm vào từng quả sẽ hiện số đếm để bé đếm theo.
  drawCount(L, q) {
    const items = this.drawGroup(L, W / 2, 300, q.n, q.item, 5, q.n > 5 ? 100 : 120);
    let counted = 0;
    items.forEach((it) => {
      it.setInteractive({ useHandCursor: true });
      it.on('pointerdown', () => {
        if (it.counted) return;
        it.counted = true;
        counted++;
        Audio.tone(380 + counted * 45, 0.12, { type: 'triangle' });
        const badge = text(this, it.x + 34, it.y - 34, String(counted), 34, '#ff5f93');
        L.add(badge);
        this.tweens.add({ targets: it, scale: it.scale * 1.15, duration: 100, yoyo: true });
      });
    });
  }

  drawGroup(L, cx, cy, n, key, maxCols = 3, size = 74) {
    const cols = Math.min(n, maxCols);
    const rows = Math.ceil(n / maxCols);
    const gap = size + 12;
    const items = [];
    for (let k = 0; k < n; k++) {
      const col = k % maxCols, row = Math.floor(k / maxCols);
      const rowCount = row === rows - 1 ? n - row * maxCols : cols;
      const x = cx + (col - (rowCount - 1) / 2) * gap;
      const y = cy + (row - (rows - 1) / 2) * gap;
      const im = this.add.image(x, y, key);
      fit(im, size);
      const s = im.scale;
      im.setScale(0);
      this.tweens.add({ targets: im, scale: s, delay: k * 50, duration: 250, ease: 'Back.easeOut' });
      L.add(im);
      items.push(im);
    }
    return items;
  }
}
