import { W, H, C, INK, SUBJECTS, TIERS } from '../config.js';
import { text, button, iconButton, enter, go, panel, starsRow, shake, fit, shade, hex, driftClouds, soundToggle, musicToggle } from '../ui/helpers.js';
import { chibiImage } from '../art/svg.js';
import Mascot from '../ui/Mascot.js';
import Save from '../core/SaveManager.js';
import Audio from '../core/AudioManager.js';
import { isLevelUnlocked, findIsland, islandStars, subjectMet } from '../core/Rewards.js';

// Bản đồ đảo: mỗi trạm là một môn (chạm để chọn 1 trong 6 cấp độ), trạm cuối là Boss.
export default class MapScene extends Phaser.Scene {
  constructor() { super('Map'); }

  init(data) {
    this.islandId = data?.islandId || Save.data.lastIsland || 'grade1';
  }

  create() {
    enter(this);
    this.busy = false;
    this.island = findIsland(this.registry.get('islands'), this.islandId);
    const { subjects, boss } = this.island;

    this.add.image(W / 2, H / 2, this.island.bg || 'bg_island');
    driftClouds(this, [70, 150]);

    panel(this, W / 2, 52, 520, 76, 0xffffff, 0.9);
    text(this, W / 2, 38, 'Sân luyện tập', 34, '#ff5f93');
    text(this, W / 2, 70, this.island.name, 20, '#8a5cd6');
    iconButton(this, 56, 52, 'ic_home', C.pink, () => go(this, 'Journey', { islandId: this.island.id }));
    iconButton(this, 146, 52, 'ic_book', C.yellow, () => this.openBook());
    panel(this, 1000, 52, 150, 70, 0xffffff, 0.9);
    this.add.image(960, 50, 'star').setScale(0.5);
    text(this, 1020, 50, `${islandStars(this.island)}`, 38, '#e89a1a');
    musicToggle(this, 1130, 52, 70);
    soundToggle(this, 1218, 52, 70);

    const [tx, ty] = this.island.tree || [420, 268];
    const lit = Save.levelStars(boss.id) > 0;
    const tree = this.add.image(tx, ty, lit ? 'tree_big_lit' : 'tree_big').setScale(0.7);
    if (lit) this.tweens.add({ targets: tree, scale: 0.73, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    text(this, tx, ty + 128, 'Cây Tri Thức', 26, '#4f9e5a');

    const stops = [...subjects, boss];
    const curve = new Phaser.Curves.Spline(stops.map((s) => new Phaser.Math.Vector2(s.pos[0], s.pos[1])));
    const path = this.add.graphics();
    curve.getSpacedPoints(90).forEach((p) => {
      path.fillStyle(0x000000, 0.08).fillCircle(p.x + 2, p.y + 3, 6);
      path.fillStyle(0xffffff, 0.95).fillCircle(p.x, p.y, 6);
    });

    this.stations = {};
    subjects.forEach((s) => { this.stations[s.id] = this.makeSubject(s); });
    this.stations[boss.id] = this.makeBoss(boss);

    const st = this.stations[Save.lastSubject(this.island.id)] || this.stations[subjects[0].id];
    this.kid = chibiImage(this, st.x, st.y - st.r + 14, Save.player, 'normal').setScale(0.42).setOrigin(0.5, 1).setDepth(30);

    this.mascot = new Mascot(this);
    this.mascot.owl.setDepth(310);
    this.mascot.box.setDepth(311);
    this.time.delayedCall(400, () => this.mascot.say('Sân luyện tập: bé chơi lại các trò đã gặp trên đường phiêu lưu nhé!'));
  }

  station(x, y, r, col, icon, locked) {
    const c = this.add.container(x, y).setDepth(10);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.15).fillEllipse(0, r * 0.9, r * 1.9, r * 0.6);
    g.fillStyle(locked ? 0x9e94a6 : shade(col, 0.8), 1).fillCircle(0, 6, r);
    g.fillStyle(locked ? 0xc9c2cc : col, 1).fillCircle(0, 0, r);
    g.lineStyle(6, 0xffffff, 1).strokeCircle(0, 0, r - 3);
    const ic = this.add.image(0, -2, icon);
    fit(ic, r * 1.35);
    if (locked) ic.setAlpha(0.55);
    c.add([g, ic]);
    c.setSize(r * 2, r * 2).setInteractive({ useHandCursor: true });
    return c;
  }

  makeSubject(s) {
    const [x, y] = s.pos;
    const r = 52;
    // Trò chưa gặp trên hành trình thì khoá lại.
    const met = subjectMet(this.island, s);
    const c = this.station(x, y, r, SUBJECTS[s.subject].color, s.icon, !met);
    if (!met) {
      c.add(this.add.image(r * 0.62, r * 0.55, 'lock').setScale(0.55));
      c.add(text(this, 0, r + 24, '???', 24, '#a99bb0'));
      c.on('pointerdown', () => {
        shake(this, c);
        Audio.wrong();
        this.mascot.say('Bé sẽ gặp trò này trên đường phiêu lưu nhé!');
      });
      return { x, y, r, c };
    }
    const done = s.levels.filter((l) => Save.levelStars(l.id) > 0).length;
    // Thanh 6 chấm thể hiện số cấp đã qua.
    const dots = this.add.graphics();
    TIERS.forEach((t, k) => {
      dots.fillStyle(k < done ? t.color : 0xffffff, 1).fillCircle((k - 2.5) * 15, r + 14, 6);
      dots.lineStyle(2, 0x5b3a5e, 0.4).strokeCircle((k - 2.5) * 15, r + 14, 6);
    });
    c.add([dots, text(this, 0, r + 44, s.title, 24, INK)]);
    c.on('pointerdown', () => this.openSubject(s));
    return { x, y, r, c };
  }

  makeBoss(boss) {
    const [x, y] = boss.pos;
    const r = 64;
    const unlocked = isLevelUnlocked(this.island, boss);
    const c = this.station(x, y, r, SUBJECTS[boss.subject].color, boss.icon, !unlocked);
    if (!unlocked) c.add(this.add.image(r * 0.62, r * 0.55, 'lock').setScale(0.55));
    else c.add(starsRow(this, 0, r + 18, Save.levelStars(boss.id), 26));
    c.add(text(this, 0, r + (unlocked ? 50 : 24), boss.title, 24, INK));
    if (unlocked && Save.levelStars(boss.id) === 0) {
      this.tweens.add({ targets: c, scale: 1.08, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    c.on('pointerdown', () => {
      if (this.busy) return;
      if (!isLevelUnlocked(this.island, boss)) {
        shake(this, c);
        Audio.wrong();
        this.mascot.say(`${boss.title} đang chờ ở cuối đường phiêu lưu. Bé thắng nó rồi mới luyện lại ở đây được nhé!`);
        return;
      }
      this.play(boss, boss.id);
    });
    return { x, y, r, c };
  }

  // Nhân vật nhảy tới trạm rồi vào màn chơi.
  play(level, stationId) {
    if (this.busy) return;
    this.busy = true;
    Save.setLastSubject(this.island.id, level.parent || stationId);
    const st = this.stations[stationId];
    const tx = st.x, ty = st.y - st.r + 14;
    const dist = Phaser.Math.Distance.Between(this.kid.x, this.kid.y, tx, ty);
    const dur = Math.max(250, dist * 1.3);
    this.tweens.add({ targets: this.kid, x: tx, y: ty, duration: dur, ease: 'Sine.easeInOut', onComplete: () => go(this, level.type, { level }) });
    this.tweens.add({ targets: this.kid, scaleY: 0.38, duration: 120, yoyo: true, repeat: Math.floor(dur / 240) });
  }

  overlay(title) {
    const layer = this.add.container(0, 0).setDepth(300);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.4).setInteractive();
    layer.add([dim, panel(this, W / 2, H / 2, 1000, 560, 0xfffaf2, 1)]);
    layer.add(text(this, W / 2, 140, title, 48, '#ff5f93'));
    layer.add(button(this, W / 2 + 400, 140, 140, 64, 'Đóng', C.pink, () => layer.destroy(), { size: 28 }));
    layer.setAlpha(0);
    this.tweens.add({ targets: layer, alpha: 1, duration: 200 });
    return layer;
  }

  openSubject(s) {
    if (this.busy) return;
    const layer = this.overlay(s.title);
    const ic = this.add.image(W / 2 - 400, 140, s.icon);
    layer.add(fit(ic, 80));
    s.levels.forEach((lv, k) => {
      const x = W / 2 + ((k % 3) - 1) * 300;
      const y = 300 + Math.floor(k / 3) * 190;
      const open = isLevelUnlocked(this.island, lv);
      const tier = TIERS[k];
      const card = button(this, x, y, 260, 150, '', open ? tier.color : C.grey, () => {
        if (!open) {
          shake(this, card);
          Audio.wrong();
          this.mascot.say(`Bé hãy qua cấp ${TIERS[k - 1].name} trước nhé!`);
          return;
        }
        layer.destroy();
        this.play(lv, s.id);
      }, { radius: 28 });
      card.add(text(this, 0, -36, tier.name, 34, '#ffffff', { stroke: hex(shade(open ? tier.color : C.grey, 0.7)), strokeThickness: 7 }));
      card.add(text(this, 0, 4, `Cấp ${k + 1}`, 22, '#ffffff', { strokeThickness: 0 }));
      if (open) card.add(starsRow(this, 0, 46, Save.levelStars(lv.id), 34));
      else card.add(this.add.image(0, 44, 'lock').setScale(0.5));
      layer.add(card);
    });
  }

  openBook() {
    const layer = this.overlay('Sổ nhãn dán của bé');
    const stops = [...this.island.subjects, this.island.boss];
    const cols = stops.length > 10 ? 6 : 5;
    const gap = cols === 6 ? 160 : 200;
    stops.forEach((s, i) => {
      const key = s.sticker || s.icon;
      const x = W / 2 - (gap * (cols - 1)) / 2 + (i % cols) * gap;
      const y = 250 + Math.floor(i / cols) * 165;
      const owned = Save.data.stickers.includes(key);
      layer.add(this.add.circle(x, y, 56, owned ? 0xfff0c2 : 0xeee8f0));
      const im = this.add.image(x, y, key);
      fit(im, 92);
      if (!owned) im.setTint(0x5b3a5e).setAlpha(0.18);
      layer.add(im);
      layer.add(text(this, x, y + 72, s.title, 22, INK));
    });
    layer.add(text(this, W / 2, 585, `Tranh đã tô: ${Save.data.album.length}`, 30, '#8a5cd6'));
  }
}
