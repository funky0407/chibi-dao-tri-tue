import { INK } from '../config.js';
import { text } from './helpers.js';
import Audio from '../core/AudioManager.js';

const BORDER = 0xb48cf0;

// Cú Bông: đứng góc dưới bên trái, nói gợi ý trong bong bóng và đọc to (nếu máy có giọng tiếng Việt).
// Chạm vào cú để nghe lại câu vừa nói.
export default class Mascot {
  constructor(scene, x = 78, y = 640, scale = 0.6) {
    this.scene = scene;
    this.owl = scene.add.image(x, y, 'owl').setScale(scale).setDepth(60).setInteractive({ useHandCursor: true });
    scene.tweens.add({ targets: this.owl, y: y - 10, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.owl.on('pointerdown', () => { if (this.last) this.say(this.last.str, this.last.opts); });
    this.box = scene.add.container(x + 62, 706).setDepth(61).setVisible(false);
    this.bg = scene.add.graphics();
    this.txt = text(scene, 0, 0, '', 28, INK, { strokeThickness: 0, align: 'left', wordWrap: { width: 520, useAdvancedWrap: true } }).setOrigin(0, 0.5);
    this.box.add([this.bg, this.txt]);
    this.timer = null;
  }

  say(str, opts = {}) {
    const { speak = true, speech, lang = 'vi-VN', duration = 4500 } = opts;
    this.last = { str, opts };
    const p = 18;
    this.txt.setText(str);
    const w = this.txt.width + p * 2;
    const h = this.txt.height + p;
    const g = this.bg;
    g.clear();
    g.fillStyle(0x000000, 0.08).fillRoundedRect(4, -h + 4, w, h, 22);
    g.fillStyle(0xffffff, 1).fillRoundedRect(0, -h, w, h, 22);
    g.lineStyle(4, BORDER, 1).strokeRoundedRect(0, -h, w, h, 22);
    const my = -h / 2;
    g.fillStyle(0xffffff, 1).fillTriangle(4, my - 12, 4, my + 12, -20, my + 20);
    g.lineStyle(4, BORDER, 1).lineBetween(0, my - 12, -20, my + 20).lineBetween(0, my + 12, -20, my + 20);
    this.txt.setPosition(p, my);

    this.box.setVisible(true).setScale(0.6).setAlpha(1);
    this.scene.tweens.killTweensOf(this.box);
    this.scene.tweens.add({ targets: this.box, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: this.owl, angle: { from: -10, to: 10 }, duration: 120, yoyo: true, repeat: 2, onComplete: () => this.owl.setAngle(0) });
    if (speak) Audio.speak(speech || str, lang);
    if (this.timer) this.timer.remove();
    this.timer = duration ? this.scene.time.delayedCall(duration, () => this.hide()) : null;
  }

  hide() {
    if (!this.box.visible) return;
    this.scene.tweens.add({ targets: this.box, alpha: 0, duration: 200, onComplete: () => this.box.setVisible(false) });
  }
}
