import { W, H, C } from '../config.js';
import { text, iconButton, go, enter, burst, laughingDog } from '../ui/helpers.js';
import Mascot from '../ui/Mascot.js';
import Save from '../core/SaveManager.js';
import Audio from '../core/AudioManager.js';

// Lớp cha của mọi mini-game: nhận cấu hình màn từ JSON, đếm đúng/sai, tính sao và chuyển sang màn kết quả.
export default class BaseMinigame extends Phaser.Scene {
  init(data) {
    this.level = data.level;
    // Có khi chơi từ con đường phiêu lưu: { islandId, stop, rest? }
    this.journey = data.journey || null;
    this.cfg = this.level.config || {};
    this.correct = 0;
    this.wrong = 0;
    this.finished = false;
    this.locked = false;
    this.dots = null;
    this._dogBusy = false;
  }

  setup({ bg = 'bg_play', title } = {}) {
    enter(this);
    this.add.image(W / 2, H / 2, bg);
    iconButton(this, 56, 52, 'ic_home', C.pink, () => go(this, this.journey ? 'Journey' : 'Map', { islandId: this.level.islandId })).setDepth(40);
    this.titleText = text(this, W / 2, 50, title ?? this.level.title, 44, '#ff5f93').setDepth(40);
    this.mascot = new Mascot(this);
    this.events.once('shutdown', () => {
      if (window.speechSynthesis) speechSynthesis.cancel();
      if (this.input.keyboard) this.input.keyboard.removeAllListeners();
      ['pointermove', 'dragstart', 'drag', 'dragend'].forEach((e) => this.input.off(e));
    });
  }

  setProgress(i, n) {
    if (!this.dots) this.dots = this.add.graphics().setDepth(40);
    const g = this.dots;
    const gap = 34;
    const x0 = W - 56 - (n - 1) * gap;
    g.clear();
    for (let k = 0; k < n; k++) {
      g.fillStyle(k < i ? C.yellow : 0xffffff, 1).fillCircle(x0 + k * gap, 52, 12);
      g.lineStyle(3, k < i ? 0xe0a62a : 0xd9cfe0, 1).strokeCircle(x0 + k * gap, 52, 12);
    }
  }

  good(x, y, { sound = true } = {}) {
    this.correct++;
    Save.addStat(this.level.subject, true);
    if (sound) Audio.correct();
    if (x !== undefined) burst(this, x, y);
  }

  bad(hint, { sound = true, dog = true } = {}) {
    this.wrong++;
    Save.addStat(this.level.subject, false);
    if (sound) Audio.wrong();
    if (dog) laughingDog(this);
    if (hint) this.mascot.say(hint);
  }

  starsFromAccuracy() {
    const total = this.correct + this.wrong;
    if (!total) return 1;
    const acc = this.correct / total;
    return acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
  }

  finish(stars) {
    if (this.finished) return;
    this.finished = true;
    if (stars == null) stars = this.starsFromAccuracy();
    const res = Save.recordLevel(this.level.id, stars);
    if (res.first) Save.addSticker(this.level.sticker || this.level.icon);
    this.time.delayedCall(700, () => go(this, 'Result', { level: this.level, stars, first: res.first, journey: this.journey }));
  }
}
