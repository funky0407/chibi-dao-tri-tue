import { W, H, C, INK } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, button, panel, fit, floatText, shake } from '../ui/helpers.js';
import { rnd, pick, catchTarget } from '../core/QuestionGenerator.js';
import { starsFromRatio } from '../core/Rewards.js';

const BASKET_Y = 640;

// Phản xạ: di chuyển giỏ (chuột, ngón tay hoặc phím mũi tên) để hứng quả có số được yêu cầu.
export default class CatchGame extends BaseMinigame {
  constructor() { super('catch'); }

  create() {
    this.setup();
    this.running = false;
    this.caught = 0;
    this.items = [];
    this.timeLeft = this.cfg.time;
    this.target = 0;

    // Bảng đề bài nằm trên lớp quả rơi (depth 20) để luôn đọc được.
    panel(this, W / 2, 140, 600, 80, 0xffffff, 0.9).setDepth(25);
    this.targetText = text(this, W / 2, 138, 'Sẵn sàng chưa?', 42, '#ff5f93').setDepth(25);
    this.timerG = this.add.graphics().setDepth(25);
    this.counter = text(this, W - 150, 140, `0/${this.cfg.goal}`, 40, '#4f9e5a').setDepth(25);
    this.drawTimer();

    this.basket = this.add.image(W / 2, BASKET_Y, 'basket').setScale(0.9).setDepth(30);
    this.basketTarget = W / 2;
    const follow = (p) => { if (this.running) this.basketTarget = Phaser.Math.Clamp(p.x, 100, W - 100); };
    this.input.on('pointermove', follow);
    this.input.on('pointerdown', follow);
    this.cursors = this.input.keyboard.createCursorKeys();

    this.startBtn = button(this, W / 2, 380, 320, 100, 'Bắt đầu!', C.pink, () => this.begin()).setDepth(60);
    this.mascot.say('Bé di chuyển giỏ để hứng đúng quả có số được yêu cầu nhé!', { duration: 0 });
  }

  begin() {
    this.startBtn.destroy();
    this.running = true;
    this.newTarget();
    this.spawner = this.time.addEvent({ delay: this.cfg.spawn, loop: true, callback: () => this.spawn() });
    this.clock = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tick() });
    this.spawn();
  }

  newTarget() {
    const t = catchTarget(this.cfg, this.target);
    this.target = t.value;
    // "số 5" hoặc "số bằng 3 + 2"
    this.targetLabel = (t.op === 'num' ? '' : 'số bằng ') + t.label;
    this.sinceChange = 0;
    this.targetText.setText(`Hứng quả có ${this.targetLabel}`);
    this.tweens.add({ targets: this.targetText, scale: 1.15, duration: 150, yoyo: true });
    this.mascot.say(`Bây giờ bé hứng ${this.targetLabel} nhé!`, {
      speech: `Bây giờ bé hứng ${t.op === 'num' ? '' : 'số bằng '}${t.speech} nhé!`, duration: 2200,
    });
  }

  spawn() {
    const isTarget = Math.random() < (this.cfg.rate ?? 0.45);
    let num = this.target;
    if (!isTarget) do { num = rnd(1, this.cfg.max); } while (num === this.target);
    const c = this.add.container(rnd(120, W - 120), -60).setDepth(20);
    const fruit = this.add.image(0, 0, pick(['apple', 'strawberry']));
    fit(fruit, 104);
    const badge = this.add.circle(0, 12, 25, 0xffffff).setStrokeStyle(4, 0x5b3a5e);
    c.add([fruit, badge, text(this, 0, 10, String(num), 38, INK, { strokeThickness: 0 })]);
    c.num = num;
    c.vy = rnd(this.cfg.speed[0], this.cfg.speed[1]) * (1 + this.caught * 0.03);
    this.items.push(c);
  }

  update(time, delta) {
    if (!this.running) return;
    const dt = delta / 1000;
    if (this.cursors.left.isDown) this.basketTarget -= 700 * dt;
    if (this.cursors.right.isDown) this.basketTarget += 700 * dt;
    this.basketTarget = Phaser.Math.Clamp(this.basketTarget, 100, W - 100);
    this.basket.x += (this.basketTarget - this.basket.x) * Math.min(1, dt * 14);
    for (const it of this.items.slice()) {
      it.y += it.vy * dt;
      if (it.y > BASKET_Y - 50 && it.y < BASKET_Y + 10 && Math.abs(it.x - this.basket.x) < 90) this.catchItem(it);
      else if (it.y > H + 60) this.removeItem(it);
    }
  }

  removeItem(it) {
    this.items = this.items.filter((x) => x !== it);
    it.destroy();
  }

  catchItem(it) {
    this.items = this.items.filter((x) => x !== it);
    this.tweens.add({ targets: it, y: BASKET_Y, scale: 0, duration: 150, onComplete: () => it.destroy() });
    if (it.num === this.target) {
      this.caught++;
      this.sinceChange++;
      this.good(it.x, BASKET_Y - 40);
      floatText(this, it.x, BASKET_Y - 80, '+1');
      this.tweens.add({ targets: this.basket, scaleY: 0.8, duration: 80, yoyo: true });
      this.counter.setText(`${this.caught}/${this.cfg.goal}`);
      if (this.caught >= this.cfg.goal) this.end();
      else if (this.sinceChange >= 4) this.newTarget();
    } else {
      shake(this, this.basket);
      this.bad(`Đó là số ${it.num}. Bé hứng ${this.targetLabel} nhé!`);
    }
  }

  tick() {
    this.timeLeft--;
    this.drawTimer();
    if (this.timeLeft <= 0) this.end();
  }

  drawTimer() {
    const g = this.timerG;
    const w = 500 * Math.max(0, this.timeLeft) / this.cfg.time;
    g.clear();
    g.fillStyle(0xffffff, 0.8).fillRoundedRect(W / 2 - 254, 192, 508, 22, 11);
    g.fillStyle(this.timeLeft > 10 ? C.mint : C.red, 1).fillRoundedRect(W / 2 - 250, 196, Math.max(14, w), 14, 7);
  }

  end() {
    if (!this.running) return;
    this.running = false;
    this.spawner.remove();
    this.clock.remove();
    this.items.forEach((it) => it.destroy());
    this.items = [];
    this.targetText.setText(this.caught >= this.cfg.goal ? 'Hoàn thành!' : 'Hết giờ!');
    const ratio = (this.caught - this.wrong * 0.5) / this.cfg.goal;
    this.finish(starsFromRatio(ratio, 0.9, 0.6));
  }
}
