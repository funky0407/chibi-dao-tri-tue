import { W, H, C, INK } from '../config.js';
import { text, button, iconButton, enter, go, panel, floatText, fit } from '../ui/helpers.js';
import { chibiImage, ensureChibi } from '../art/svg.js';
import Save from '../core/SaveManager.js';
import Audio from '../core/AudioManager.js';
import { ACCESSORIES, accessoryUnlocked } from '../core/Rewards.js';

const SKINS = ['#ffe0c7', '#f5c9a0', '#d9a074'];
const HAIRS = ['#6b4226', '#2f2433', '#e8a33d', '#ff8fab', '#7a6cf0'];
const OUTFITS = ['#ff8fab', '#ffc94d', '#5fd3a8', '#6cc4ff', '#b48cf0', '#ff8a5c'];

export default class CharacterScene extends Phaser.Scene {
  constructor() { super('Character'); }

  create() {
    enter(this);
    this.add.image(W / 2, H / 2, 'bg_play');
    this.p = { ...Save.player };
    this.drawers = [];

    iconButton(this, 56, 52, 'ic_home', C.pink, () => go(this, 'Menu'));
    text(this, W / 2, 52, 'Tạo nhân vật của bé', 52, '#ff5f93');

    panel(this, 300, 400, 420, 560, 0xffffff, 0.75);
    this.add.ellipse(300, 640, 260, 40, 0xb48cf0, 0.25);
    this.preview = chibiImage(this, 300, 400, this.p, 'happy').setScale(1.15);

    panel(this, 865, 390, 700, 540, 0xffffff, 0.8);
    this.label(160, 'Bé là:');
    this.genderBtns = [['girl', 'Bé gái', C.pink, 780], ['boy', 'Bé trai', C.sky, 980]].map(([id, name, col, x]) => {
      const b = button(this, x, 160, 180, 64, name, col, () => { this.p.gender = id; this.refresh(); }, { size: 28 });
      b.value = id;
      return b;
    });
    this.swatchRow(232, 'Màu da:', SKINS, 'skin');
    this.swatchRow(304, 'Màu tóc:', HAIRS, 'hair');
    this.swatchRow(376, 'Màu áo:', OUTFITS, 'outfit');

    // Phụ kiện: 2 hàng, mỗi hàng 6 món.
    this.label(440, 'Phụ kiện:');
    this.accBtns = ACCESSORIES.map((a, i) => {
      const open = accessoryUnlocked(a);
      const x = 600 + (i % 6) * 88;
      const y = 480 + Math.floor(i / 6) * 62;
      const b = button(this, x, y, 82, 54, open ? a.name : `${a.stars} ★`, open ? C.purple : C.grey, () => {
        if (!open) {
          Audio.wrong();
          floatText(this, x, y - 40, `Cần ${a.stars} ★`, '#e89a1a', 30);
          return;
        }
        this.p.acc = a.id;
        this.refresh();
      }, { size: a.name.length > 5 && open ? 15 : 20, radius: 18 });
      b.value = a.id;
      return b;
    });

    button(this, 1130, 612, 150, 70, 'Xong rồi!', C.mint, () => {
      Save.setPlayer(this.p);
      go(this, 'World');
    });
    this.refresh(true);
  }

  label(y, str) {
    text(this, 545, y, str, 32, INK).setOrigin(0, 0.5);
  }

  swatchRow(y, label, colors, key) {
    this.label(y, label);
    colors.forEach((col, i) => {
      const x = 720 + i * 82;
      const g = this.add.graphics({ x, y });
      const color = Phaser.Display.Color.HexStringToColor(col).color;
      this.drawers.push(() => {
        const sel = this.p[key] === col;
        g.clear();
        g.fillStyle(sel ? 0x5b3a5e : 0xffffff, 1).fillCircle(0, 0, sel ? 35 : 31);
        g.fillStyle(color, 1).fillCircle(0, 0, 26);
        g.setScale(sel ? 1.08 : 1);
      });
      g.setInteractive(new Phaser.Geom.Circle(0, 0, 34), Phaser.Geom.Circle.Contains);
      g.on('pointerdown', () => { this.p[key] = col; Audio.pop(); this.refresh(); });
    });
  }

  refresh(initial = false) {
    this.drawers.forEach((d) => d());
    this.genderBtns.forEach((b) => b.setAlpha(b.value === this.p.gender ? 1 : 0.45));
    this.accBtns.forEach((b) => b.setAlpha(b.value === this.p.acc ? 1 : 0.6));
    if (initial) return;
    ensureChibi(this.textures, this.p, 'happy').then((key) => {
      if (!this.preview.scene) return;
      this.preview.setTexture(key);
      this.tweens.add({ targets: this.preview, scaleY: { from: 1.0, to: 1.15 }, duration: 260, ease: 'Back.easeOut' });
    });
  }
}
