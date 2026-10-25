import { W, H, C } from '../config.js';
import { text, button, soundToggle, musicToggle, enter, go, driftClouds } from '../ui/helpers.js';
import { chibiImage } from '../art/svg.js';
import Save from '../core/SaveManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    enter(this);
    this.add.image(W / 2, H / 2, 'bg_island');
    driftClouds(this);

    const title = text(this, W / 2, 105, 'Bé Chibi Phiêu Lưu', 88, '#ff5f93', { strokeThickness: 16 });
    const sub = text(this, W / 2, 195, 'Đảo Trí Tuệ', 64, '#8a5cd6', { strokeThickness: 12 });
    this.tweens.add({ targets: [title, sub], y: '-=8', duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const kid = chibiImage(this, 380, 470, Save.player, 'happy').setScale(0.95);
    this.tweens.add({ targets: kid, y: 452, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const owl = this.add.image(560, 545, 'owl').setScale(0.75);
    this.tweens.add({ targets: owl, angle: { from: -6, to: 6 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    button(this, 930, 380, 380, 100, 'Chơi ngay!', C.pink, () => go(this, Save.data.player ? 'World' : 'Character'));
    button(this, 930, 500, 380, 90, 'Nhân vật', C.yellow, () => go(this, 'Character'));
    button(this, 930, 612, 300, 76, 'Phụ huynh', C.purple, () => go(this, 'Parent'), { size: 34 });
    musicToggle(this, W - 150, 56);
    soundToggle(this, W - 60, 56);
  }
}
