import { INK } from '../config.js';
import BaseMinigame from './BaseMinigame.js';
import { text, burst, confetti } from '../ui/helpers.js';
import Save from '../core/SaveManager.js';
import Audio from '../core/AudioManager.js';
import { pick } from '../core/QuestionGenerator.js';

const OX = 190, OY = 118;
const toPoints = (flat) => {
  const pts = [];
  for (let k = 0; k < flat.length; k += 2) pts.push(new Phaser.Math.Vector2(flat[k], flat[k + 1]));
  return pts;
};

// Tô màu theo số: mỗi vùng là một hình (c: tròn, e: elip, r: chữ nhật, p: đa giác) trong toạ độ 600x480.
export default class ColorGame extends BaseMinigame {
  constructor() { super('color'); }

  create() {
    this.setup();
    const pics = this.cfg.pictures;
    this.pic = pics.find((p) => p.id === this.cfg.picture) || pick(pics);
    this.sel = null;
    this.done = false;
    this.titleText.setText(`${this.level.title}: ${this.pic.name}`);

    const frame = this.add.graphics();
    frame.fillStyle(0x5b3a5e, 0.12).fillRoundedRect(OX - 10, OY - 4, 620, 500, 24);
    frame.fillStyle(0xffffff, 1).fillRoundedRect(OX - 14, OY - 14, 628, 508, 24);

    // "line" là nét trang trí (dây bóng bay, cột cờ): chỉ vẽ, không cần tô.
    this.regions = [];
    this.pic.regions.forEach((r) => {
      if (r.line) this.add.graphics({ x: OX, y: OY }).setDepth(1).lineStyle(4, 0x5b3a5e, 1).lineBetween(...r.line);
      else this.regions.push(this.makeRegion(r));
    });
    this.makePalette();
    this.mascot.say('Bé chọn màu bên phải, rồi chạm vào vùng có cùng số nhé!');
  }

  makeRegion(r) {
    const g = this.add.graphics({ x: OX, y: OY }).setDepth(1);
    let geom, contains, lx, ly, minDim;
    if (r.c) { const [x, y, rad] = r.c; geom = new Phaser.Geom.Circle(x, y, rad); contains = Phaser.Geom.Circle.Contains; lx = x; ly = y; minDim = rad * 2; }
    else if (r.e) { const [x, y, rx, ry] = r.e; geom = new Phaser.Geom.Ellipse(x, y, rx * 2, ry * 2); contains = Phaser.Geom.Ellipse.Contains; lx = x; ly = y; minDim = Math.min(rx, ry) * 2; }
    else if (r.r) { const [x, y, w, h] = r.r; geom = new Phaser.Geom.Rectangle(x, y, w, h); contains = Phaser.Geom.Rectangle.Contains; lx = x + w / 2; ly = y + h / 2; minDim = Math.min(w, h); }
    else {
      geom = new Phaser.Geom.Polygon(r.p);
      contains = Phaser.Geom.Polygon.Contains;
      const pts = toPoints(r.p);
      lx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      ly = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      const b = Phaser.Geom.Polygon.GetAABB(geom);
      minDim = Math.min(b.width, b.height);
    }
    if (r.l) [lx, ly] = r.l;
    const region = { ...r, g, filled: false, lx: OX + lx, ly: OY + ly };
    this.drawRegion(region, 0xffffff);
    g.setInteractive(geom, contains);
    g.on('pointerdown', () => this.paint(region));
    // Vùng nhỏ thì số nhỏ lại để không đè lên viền.
    const size = Phaser.Math.Clamp(Math.round(minDim * 0.75), 16, 26);
    region.label = text(this, region.lx, region.ly, String(r.n), size, INK).setDepth(5);
    return region;
  }

  drawRegion(r, color) {
    const g = r.g;
    g.clear();
    g.fillStyle(color, 1);
    g.lineStyle(4, 0x5b3a5e, 1);
    if (r.c) { const [x, y, rad] = r.c; g.fillCircle(x, y, rad).strokeCircle(x, y, rad); }
    else if (r.e) { const [x, y, rx, ry] = r.e; g.fillEllipse(x, y, rx * 2, ry * 2).strokeEllipse(x, y, rx * 2, ry * 2); }
    else if (r.r) {
      const [x, y, w, h, rad = 0] = r.r;
      if (rad) g.fillRoundedRect(x, y, w, h, rad).strokeRoundedRect(x, y, w, h, rad);
      else g.fillRect(x, y, w, h).strokeRect(x, y, w, h);
    } else {
      const pts = toPoints(r.p);
      g.fillPoints(pts, true).strokePoints(pts, true);
    }
  }

  makePalette() {
    this.swatches = this.pic.colors.map((hexStr, k) => {
      const x = k % 2 ? 1120 : 975;
      const y = 180 + Math.floor(k / 2) * 125;
      const color = Phaser.Display.Color.HexStringToColor(hexStr).color;
      const c = this.add.container(x, y);
      const ring = this.add.circle(0, 0, 60, 0x5b3a5e).setVisible(false);
      const dot = this.add.circle(0, 0, 52, color).setStrokeStyle(6, 0xffffff);
      c.add([ring, dot, text(this, 0, -2, String(k + 1), 46, '#ffffff', { stroke: '#5b3a5e', strokeThickness: 8 })]);
      c.setSize(120, 120).setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => {
        this.sel = k + 1;
        Audio.pop();
        this.swatches.forEach((s, j) => { s.ring.setVisible(j === k); s.c.setScale(j === k ? 1.12 : 1); });
      });
      return { c, ring, color };
    });
  }

  paint(r) {
    if (r.filled || this.done) return;
    if (!this.sel) {
      this.mascot.say('Bé chọn một màu bên phải trước nhé!');
      return;
    }
    if (this.sel !== r.n) {
      this.bad(`Vùng này cần màu số ${r.n} đó!`);
      this.tweens.add({ targets: r.label, scale: 1.6, duration: 150, yoyo: true, repeat: 1 });
      return;
    }
    r.filled = true;
    this.drawRegion(r, this.swatches[r.n - 1].color);
    r.label.setVisible(false);
    this.good();
    burst(this, r.lx, r.ly, 8);
    if (this.regions.every((x) => x.filled)) {
      this.done = true;
      Save.addAlbum(this.pic.id);
      this.time.delayedCall(400, () => {
        confetti(this);
        Audio.win();
        this.mascot.say('Bức tranh thật đẹp! Bé giỏi quá!');
      });
      this.time.delayedCall(2600, () => this.finish());
    }
  }
}
