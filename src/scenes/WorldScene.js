import { W, H, C, INK } from '../config.js';
import { text, iconButton, enter, go, panel, shake, fit, driftClouds, soundToggle, musicToggle } from '../ui/helpers.js';
import { chibiImage } from '../art/svg.js';
import Mascot from '../ui/Mascot.js';
import Save from '../core/SaveManager.js';
import Audio from '../core/AudioManager.js';
import { isIslandUnlocked, findIsland } from '../core/Rewards.js';

// Bản đồ thế giới: chọn đảo. Đảo sau mở khi Boss đảo trước bị đánh bại.
export default class WorldScene extends Phaser.Scene {
  constructor() { super('World'); }

  create() {
    enter(this);
    this.busy = false;
    this.islands = this.registry.get('islands');
    this.add.image(W / 2, H / 2, 'bg_sea');
    driftClouds(this, [70, 150]);

    panel(this, W / 2, 52, 520, 76, 0xffffff, 0.9);
    text(this, W / 2, 50, 'Bản đồ phiêu lưu', 42, '#ff5f93');
    iconButton(this, 56, 52, 'ic_home', C.pink, () => go(this, 'Menu'));
    musicToggle(this, 1130, 52, 70);
    soundToggle(this, 1218, 52, 70);

    // Đường đi biển nối các đảo
    const pts = this.islands.map((i) => new Phaser.Math.Vector2(i.world[0], i.world[1]));
    if (pts.length > 1) {
      const g = this.add.graphics();
      new Phaser.Curves.Spline(pts).getSpacedPoints(30).forEach((p) => g.fillStyle(0xffffff, 0.8).fillCircle(p.x, p.y + 60, 5));
    }

    this.spots = this.islands.map((isl) => this.makeIsland(isl));
    const cur = findIsland(this.islands, Save.data.lastIsland);
    const at = isIslandUnlocked(cur) ? cur : this.islands[0];
    const [x, y] = at.world;
    this.kid = chibiImage(this, x, y - 10, Save.player, 'normal').setScale(0.42).setOrigin(0.5, 1).setDepth(30);

    this.mascot = new Mascot(this);
    this.time.delayedCall(400, () => this.mascot.say('Bé chọn một hòn đảo để phiêu lưu nhé!'));
  }

  makeIsland(isl) {
    const [x, y] = isl.world;
    const open = isIslandUnlocked(isl);
    const c = this.add.container(x, y).setDepth(10);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.1).fillEllipse(0, 70, 330, 90);
    g.fillStyle(0xf9e2b4, 1).fillEllipse(0, 50, 320, 120);
    g.fillStyle(open ? isl.color ? Phaser.Display.Color.HexStringToColor(isl.color).color : 0xa8e6a1 : 0xc9c2cc, 1).fillEllipse(0, 38, 280, 96);
    c.add(g);
    const ic = this.add.image(-70, 20, isl.icon);
    fit(ic, 90);
    const ic2 = this.add.image(80, 26, isl.icon2 || isl.icon);
    fit(ic2, 70);
    if (!open) { ic.setAlpha(0.4); ic2.setAlpha(0.4); }
    c.add([ic, ic2]);
    c.add(panel(this, 0, 128, 300, 84, 0xffffff, 0.92, 26));
    c.add(text(this, 0, 110, isl.name, 32, '#ff5f93'));
    const j = Save.journey(isl.id);
    const total = isl.journey.stops.length;
    c.add(text(this, 0, 146, open ? (j.done ? 'Đã hoàn thành' : `Chặng ${Math.min(j.reached + 1, total)}/${total}`) : 'Chưa mở', 22, INK));
    if (!open) c.add(this.add.image(0, 20, 'lock').setScale(0.9));
    // Thu nhỏ để 5 đảo vừa một màn hình.
    c.setScale(this.islands.length > 2 ? 0.74 : 1);
    c.setSize(320, 260).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => this.pick(isl, open, c));
    if (open && !j.done) this.tweens.add({ targets: c, y: y - 8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  pick(isl, open, c) {
    if (this.busy) return;
    if (!open) {
      shake(this, c);
      Audio.wrong();
      const prev = this.islands.find((i) => i.boss.id === isl.unlock.boss);
      this.mascot.say(`Bé hãy đi hết ${prev ? prev.name : 'đảo trước'} và đánh bại ${prev ? prev.boss.title : 'Boss'} để mở ${isl.name} nhé!`);
      return;
    }
    this.busy = true;
    Save.data.lastIsland = isl.id;
    Save.save();
    const [x, y] = isl.world;
    const dur = Math.max(300, Phaser.Math.Distance.Between(this.kid.x, this.kid.y, x, y - 10) * 1.2);
    this.tweens.add({ targets: this.kid, x, y: y - 10, duration: dur, ease: 'Sine.easeInOut', onComplete: () => go(this, 'Journey', { islandId: isl.id }) });
    this.tweens.add({ targets: this.kid, scaleY: 0.38, duration: 120, yoyo: true, repeat: Math.floor(dur / 240) });
  }
}
