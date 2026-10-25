import { W, H, C, INK, SUBJECTS } from '../config.js';
import { text, button, iconButton, enter, go, panel, starsRow, fit, shade, burst, confetti, soundToggle, musicToggle } from '../ui/helpers.js';
import { chibiImage } from '../art/svg.js';
import Mascot from '../ui/Mascot.js';
import Save from '../core/SaveManager.js';
import Audio from '../core/AudioManager.js';
import { findIsland, isIslandUnlocked, ACCESSORIES } from '../core/Rewards.js';
import { stopLevel, stopTitle, stopIcon, isEasier, stopPassed, PASS_STARS } from '../core/Journey.js';

const STEP = 220;
const X0 = 240;
const YS = [520, 410, 560, 440, 590, 460];
const KIND_COLOR = { chest: 0xffc94d, rest: 0xb48cf0, gate: 0x9e94a6, story: 0xff8fab };

// Giữ một đối tượng đứng yên trên màn hình khi camera cuộn theo bé.
const fixed = (o) => (o.list ? o.setScrollFactor(0, 0, true) : o.setScrollFactor(0));

// Con đường phiêu lưu: bé đi lần lượt từng chặng; phần đảo phía trước bị mây che cho tới khi qua chặng.
export default class JourneyScene extends Phaser.Scene {
  constructor() { super('Journey'); }

  init(data) {
    this.islandId = data?.islandId || Save.data.lastIsland || 'grade1';
    this.justPassed = data?.justPassed;
    this.openStop = data?.openStop;
  }

  create() {
    enter(this);
    this.busy = false;
    this.overlay = null;
    this.dragDist = 0;
    this.island = findIsland(this.registry.get('islands'), this.islandId);
    Save.data.lastIsland = this.island.id;
    Save.save();
    this.stops = this.island.journey.stops;
    this.j = Save.journey(this.island.id);
    this.pts = this.stops.map((s, i) => ({ x: X0 + i * STEP, y: YS[i % YS.length] }));
    this.worldW = X0 + (this.stops.length - 1) * STEP + 300;
    this.cameras.main.setBounds(0, 0, this.worldW, H);

    this.drawWorld();
    this.markers = this.stops.map((s, i) => this.makeStop(s, i));
    const last = this.stops.length - 1;
    const at = this.justPassed ?? Math.min(this.j.reached, last);
    this.makeFog(this.fogX(this.justPassed ?? this.j.reached));

    this.kidAt = at;
    const p = this.pts[at];
    this.kid = chibiImage(this, p.x, p.y - 34, Save.player, 'normal').setScale(0.42).setOrigin(0.5, 1).setDepth(30);
    this.followers = this.j.followers.slice(-3).map((key) => fit(this.add.image(p.x, p.y, key), 54).setOrigin(0.5, 1).setDepth(29));
    this.cameras.main.scrollX = Phaser.Math.Clamp(p.x - W / 2, 0, this.maxScroll());

    this.makeHud();
    this.setupDrag();

    if (this.justPassed !== undefined) this.time.delayedCall(450, () => this.advance(this.justPassed));
    else if (this.openStop !== undefined) this.time.delayedCall(350, () => this.open(this.openStop));
    else this.time.delayedCall(400, () => this.greet());
  }

  // ---------- Vẽ thế giới ----------

  drawWorld() {
    fixed(this.add.image(W / 2, H / 2, 'bg_sea'));
    const sand = this.add.graphics().setDepth(1);
    const grass = this.add.graphics().setDepth(1);
    const top = [], top2 = [];
    for (let x = -40; x <= this.worldW + 40; x += 40) {
      top.push({ x, y: 262 + 18 * Math.sin(x / 140) });
      top2.push({ x, y: 282 + 18 * Math.sin(x / 140) });
    }
    sand.fillStyle(0xf9e2b4, 1).fillPoints([...top, { x: this.worldW + 40, y: 760 }, { x: -40, y: 760 }], true);
    grass.fillStyle(Phaser.Display.Color.HexStringToColor(this.island.color || '#a8e6a1').color, 1)
      .fillPoints([...top2, { x: this.worldW + 40, y: 760 }, { x: -40, y: 760 }], true);

    // Cây cỏ trang trí ở dải trên và dải dưới con đường
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const decor = this.island.decor || ['tree', 'flower'];
    for (let x = 60; x < this.worldW; x += 95) {
      const key = decor[Math.floor(rand() * decor.length)];
      const y = rand() < 0.6 ? 318 + rand() * 30 : 690 + rand() * 20;
      fit(this.add.image(x + rand() * 40 - 20, y, key), 46 + rand() * 18).setDepth(2).setAlpha(0.95);
    }

    // Biển tên từng vùng
    (this.island.journey.regions || []).forEach((r) => {
      const x = this.pts[r.from].x - 105, y = 360;
      const g = this.add.graphics().setDepth(3);
      g.fillStyle(0xa86b45, 1).fillRect(x - 5, y - 10, 10, 70);
      g.fillStyle(0x5b3a5e, 0.15).fillRoundedRect(x - 88, y - 50, 180, 50, 12);
      g.fillStyle(0xd9a074, 1).fillRoundedRect(x - 90, y - 54, 180, 50, 12);
      g.lineStyle(3, 0xa86b45, 1).strokeRoundedRect(x - 90, y - 54, 180, 50, 12);
      text(this, x, y - 30, r.name, r.name.length > 14 ? 17 : 21, '#ffffff', { stroke: '#a86b45', strokeThickness: 5 }).setDepth(3);
    });

    // Đường đi chấm trắng
    const curve = new Phaser.Curves.Spline(this.pts.map((p) => new Phaser.Math.Vector2(p.x, p.y)));
    const path = this.add.graphics().setDepth(3);
    curve.getSpacedPoints(this.stops.length * 11).forEach((p) => {
      path.fillStyle(0x000000, 0.08).fillCircle(p.x + 2, p.y + 3, 6);
      path.fillStyle(0xffffff, 0.95).fillCircle(p.x, p.y, 6);
    });
  }

  makeStop(stop, i) {
    const { x, y } = this.pts[i];
    const big = stop.kind === 'gate' || stop.kind === 'boss';
    const r = big ? 58 : 46;
    const col = KIND_COLOR[stop.kind]
      ?? (stop.kind === 'boss' ? SUBJECTS.mixed.color : SUBJECTS[this.island.subjects.find((s) => s.id === stop.subject).subject].color);
    const passed = stopPassed(this.island, i);
    const c = this.add.container(x, y).setDepth(10);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.15).fillEllipse(0, r * 0.9, r * 1.9, r * 0.6);
    g.fillStyle(shade(col, 0.8), 1).fillCircle(0, 6, r);
    g.fillStyle(col, 1).fillCircle(0, 0, r);
    g.lineStyle(6, passed ? 0x5fd3a8 : 0xffffff, 1).strokeCircle(0, 0, r - 3);
    const icon = stop.kind === 'chest' && passed ? 'chest_open' : stopIcon(this.island, stop);
    c.iconImg = fit(this.add.image(0, -2, icon), r * 1.4);
    c.add([g, c.iconImg]);
    // Số thứ tự chặng
    c.add(this.add.circle(-r * 0.75, -r * 0.75, 15, 0xffffff).setStrokeStyle(3, col));
    c.add(text(this, -r * 0.75, -r * 0.75 - 1, String(i + 1), 18, INK, { strokeThickness: 0 }));
    if (stop.kind === 'story' && !passed) {
      c.add(this.add.circle(r * 0.75, -r * 0.75, 15, 0xff6f9c).setStrokeStyle(3, 0xffffff));
      c.add(text(this, r * 0.75, -r * 0.75 - 1, '!', 22, '#ffffff', { strokeThickness: 0 }));
    }
    c.add(text(this, 0, r + 20, stopTitle(this.island, stop), 21, INK));
    const stars = this.j.stars[i] || 0;
    if (passed && stop.kind !== 'chest' && stop.kind !== 'rest') c.add(starsRow(this, 0, r + 48, stars, 22));
    c.setSize(r * 2, r * 2).setInteractive({ useHandCursor: true });
    c.on('pointerup', () => { if (this.dragDist < 12) this.tapStop(i); });
    if (i === this.j.reached) this.tweens.add({ targets: c, scale: 1.08, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  // ---------- Mây che phần chưa tới ----------

  fogX(reached) {
    return reached >= this.stops.length - 1 ? Infinity : this.pts[reached].x + 110;
  }

  makeFog(fx) {
    this.fogEdge = fx;
    this.clouds = [];
    if (fx === Infinity) return;
    this.fogRect = this.add.rectangle(fx + 30, 215, this.worldW, 520, 0xf4f8ff, 0.96).setOrigin(0, 0).setDepth(48);
    let seed = 3;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let x = fx; x < this.worldW + 120; x += 115) {
      for (let y = 250; y <= 720; y += 100) {
        const cl = this.add.image(x + rand() * 40 - 20, y + rand() * 30 - 15, 'cloud').setScale(0.75 + rand() * 0.35).setDepth(49);
        this.clouds.push(cl);
      }
    }
  }

  reveal(newFx) {
    this.fogEdge = newFx;
    this.clouds = this.clouds.filter((cl) => {
      if (cl.x > newFx + 40) return true;
      this.tweens.add({ targets: cl, alpha: 0, scale: cl.scale * 1.5, y: cl.y - 40, duration: 700, delay: Math.random() * 250, onComplete: () => cl.destroy() });
      return false;
    });
    if (!this.fogRect) return;
    if (newFx === Infinity) this.tweens.add({ targets: this.fogRect, alpha: 0, duration: 700 });
    else this.tweens.add({ targets: this.fogRect, x: newFx + 30, duration: 700 });
  }

  maxScroll() {
    const limit = this.fogEdge === Infinity || this.fogEdge === undefined ? this.worldW - W : this.fogEdge - W * 0.55;
    return Phaser.Math.Clamp(limit, 0, this.worldW - W);
  }

  // ---------- Giao diện cố định ----------

  makeHud() {
    fixed(iconButton(this, 56, 52, 'ic_home', C.pink, () => go(this, 'World'))).setDepth(100);
    fixed(button(this, 215, 52, 200, 64, 'Luyện tập', C.yellow, () => go(this, 'Map', { islandId: this.island.id }), { size: 26 })).setDepth(100);
    fixed(panel(this, W / 2 + 60, 52, 470, 76, 0xffffff, 0.92)).setDepth(100);
    fixed(text(this, W / 2 + 60, 38, this.island.name, 32, '#ff5f93')).setDepth(100);
    const n = Math.min(this.j.reached + 1, this.stops.length);
    this.progressText = fixed(text(this, W / 2 + 60, 70, `Chặng ${n}/${this.stops.length}`, 20, '#8a5cd6')).setDepth(100);
    fixed(musicToggle(this, 1130, 52, 70)).setDepth(100);
    fixed(soundToggle(this, 1218, 52, 70)).setDepth(100);
    this.mascot = new Mascot(this);
    fixed(this.mascot.owl).setDepth(310);
    fixed(this.mascot.box).setDepth(311);
  }

  setupDrag() {
    const cam = this.cameras.main;
    this.input.on('pointerdown', (p) => { this.dragDist = 0; this.dragStart = p.x; this.camStart = cam.scrollX; });
    this.input.on('pointermove', (p) => {
      if (!p.isDown || this.busy || this.overlay) return;
      const dx = p.x - this.dragStart;
      this.dragDist = Math.max(this.dragDist, Math.abs(dx));
      if (this.dragDist < 12) return;
      cam.stopFollow();
      cam.scrollX = Phaser.Math.Clamp(this.camStart - dx, 0, this.maxScroll());
    });
    this.events.once('shutdown', () => { this.input.off('pointerdown'); this.input.off('pointermove'); });
  }

  update() {
    // Bạn đồng hành đi phía sau bé
    this.followers.forEach((f, k) => f.setPosition(this.kid.x - 48 * (k + 1), this.kid.y - 4));
  }

  greet() {
    const i = Math.min(this.j.reached, this.stops.length - 1);
    if (this.j.done) this.mascot.say(`Bé đã đi hết ${this.island.name}! Bé có thể chơi lại bất kỳ chặng nào nhé!`);
    else this.mascot.say(`Chặng ${i + 1}: ${stopTitle(this.island, this.stops[i])}. Bé chạm vào chặng sáng để chơi nhé!`);
  }

  // ---------- Đi lại trên đường ----------

  tapStop(i) {
    if (this.busy || this.overlay) return;
    if (i > this.j.reached) {
      this.mascot.say(`Bé cần đạt ${PASS_STARS} sao ở chặng trước để đi tiếp nhé!`);
      Audio.wrong();
      return;
    }
    this.walkTo(i, () => this.open(i));
  }

  walkTo(i, done) {
    if (i === this.kidAt) { done(); return; }
    this.busy = true;
    const dir = i > this.kidAt ? 1 : -1;
    const path = [];
    for (let k = this.kidAt + dir; dir > 0 ? k <= i : k >= i; k += dir) path.push(this.pts[k]);
    const cam = this.cameras.main;
    cam.startFollow(this.kid, true, 0.08, 0.08);
    const stepOne = () => {
      const p = path.shift();
      if (!p) {
        cam.stopFollow();
        this.kidAt = i;
        this.busy = false;
        done();
        return;
      }
      this.tweens.add({ targets: this.kid, x: p.x, y: p.y - 34, duration: 420, ease: 'Sine.easeInOut', onComplete: stepOne });
      this.tweens.add({ targets: this.kid, scaleY: 0.38, duration: 105, yoyo: true, repeat: 1 });
    };
    stepOne();
  }

  // Vừa qua chặng i: mây tan, bé đi sang chặng kế tiếp.
  advance(i) {
    const next = i + 1;
    const reached = this.j.reached;
    if (reached > i && this.fogEdge !== this.fogX(reached)) {
      Audio.win();
      this.reveal(this.fogX(reached));
    }
    if (next >= this.stops.length) {
      confetti(this);
      const opened = this.registry.get('islands').find((isl) => isl.unlock?.island === this.island.id);
      this.mascot.say(opened && isIslandUnlocked(opened)
        ? `Hoan hô! Bé đã đi hết ${this.island.name}! ${opened.name} đã mở rồi đó!`
        : `Hoan hô! Bé đã đi hết ${this.island.name}!`, { duration: 0 });
      if (opened) fixed(button(this, W / 2 + 60, 150, 300, 70, `Sang ${opened.name}`, C.pink, () => go(this, 'Journey', { islandId: opened.id }), { size: 26 })).setDepth(100);
      return;
    }
    if (reached <= i) { this.greet(); return; }
    this.progressText.setText(`Chặng ${Math.min(reached + 1, this.stops.length)}/${this.stops.length}`);
    this.time.delayedCall(700, () => this.walkTo(next, () => {
      this.mascot.say(`Chặng ${next + 1}: ${stopTitle(this.island, this.stops[next])}! Bé chạm vào để chơi nhé!`);
    }));
  }

  // ---------- Mở một chặng ----------

  open(i) {
    const stop = this.stops[i];
    if (stop.kind === 'chest') return this.openChest(i);
    if (stop.kind === 'rest') return this.openRest(i);
    if (stop.kind === 'story' && !this.j.seen.includes(i)) return this.showStory(i, () => this.start(i));
    this.start(i);
  }

  start(i) {
    const level = stopLevel(this.island, i);
    const launch = () => go(this, level.type, { level, journey: { islandId: this.island.id, stop: i } });
    if (isEasier(this.island, i)) {
      this.mascot.say('Lần này cú Bông cho đề dễ hơn một chút nhé! Bé cố lên!', { duration: 1800 });
      this.time.delayedCall(1500, launch);
    } else launch();
  }

  // Lớp phủ cố định giữa màn hình (hội thoại, rương, trạm nghỉ).
  makeOverlay() {
    const L = fixed(this.add.container(0, 0)).setDepth(300);
    // Mỗi thứ thêm vào lớp phủ cũng phải đứng yên khi camera cuộn.
    const add = L.add.bind(L);
    L.add = (o) => { (Array.isArray(o) ? o : [o]).forEach(fixed); return add(o); };
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.4).setInteractive();
    L.add(dim);
    this.overlay = L;
    L.close = () => { L.destroy(); this.overlay = null; };
    return L;
  }

  showStory(i, done) {
    const stop = this.stops[i];
    const L = this.makeOverlay();
    L.add(panel(this, W / 2, 470, 1040, 300, 0xfffaf2, 1));
    const npc = fit(this.add.image(W / 2 - 390, 450, stop.npc), 190);
    this.tweens.add({ targets: npc, y: 435, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    L.add(npc);
    L.add(text(this, W / 2 - 390, 575, stop.npcName, 30, '#ff5f93'));
    const line = text(this, W / 2 + 90, 440, '', 32, INK, { wordWrap: { width: 680 }, strokeThickness: 0 });
    L.add(line);
    let k = 0;
    const btn = button(this, W / 2 + 330, 570, 220, 70, 'Tiếp ▶', C.sky, () => next(), { size: 28 });
    L.add(btn);
    const next = () => {
      if (k >= stop.story.length) {
        Save.markSeen(this.island.id, i);
        L.close();
        done();
        return;
      }
      line.setText(stop.story[k]);
      Audio.speak(stop.story[k]);
      k++;
      if (k >= stop.story.length) { btn.label.setText('Giúp bạn!'); }
    };
    next();
  }

  openChest(i) {
    const stop = this.stops[i];
    if (stopPassed(this.island, i)) {
      this.mascot.say('Rương này bé đã mở rồi!');
      return;
    }
    const L = this.makeOverlay();
    L.add(panel(this, W / 2, H / 2, 640, 460, 0xfffaf2, 1));
    L.add(text(this, W / 2, H / 2 - 175, 'Rương báu!', 52, '#e89a1a'));
    const ch = fit(this.add.image(W / 2, H / 2 - 30, 'chest'), 200);
    L.add(ch);
    this.tweens.add({ targets: ch, angle: { from: -6, to: 6 }, duration: 90, yoyo: true, repeat: 5, onComplete: () => {
      ch.setTexture('chest_open').setAngle(0);
      Audio.win();
      burst(this, W / 2, H / 2 - 30, 30);
      const acc = ACCESSORIES.find((a) => a.id === stop.reward?.acc);
      if (acc) Save.unlockAcc(acc.id);
      L.add(text(this, W / 2, H / 2 + 100, acc ? `Bé nhận được: ${acc.name}!` : 'Bé nhận được kho báu!', 34, '#ff5f93'));
      if (acc) L.add(text(this, W / 2, H / 2 + 140, 'Vào "Nhân vật" ở màn hình chính để đeo nhé', 20, '#8a5cd6'));
      Audio.speak(acc ? `Bé nhận được ${acc.name}!` : 'Bé nhận được kho báu!');
      Save.recordStop(this.island.id, i, 3, this.stops.length);
      this.j = Save.journey(this.island.id);
      this.markers[i].iconImg.setTexture('chest_open');
      L.add(button(this, W / 2, H / 2 + 195, 240, 66, 'Tuyệt quá!', C.mint, () => { L.close(); this.advance(i); }, { size: 28 }));
    } });
  }

  openRest(i) {
    const stop = this.stops[i];
    const first = !stopPassed(this.island, i);
    if (first) {
      Save.recordStop(this.island.id, i, 3, this.stops.length);
      this.j = Save.journey(this.island.id);
    }
    const L = this.makeOverlay();
    L.add(panel(this, W / 2, H / 2, 700, 420, 0xfffaf2, 1));
    L.add(fit(this.add.image(W / 2, H / 2 - 120, 'rainbow'), 120));
    L.add(text(this, W / 2, H / 2 - 40, stop.name, 40, '#8a5cd6'));
    L.add(text(this, W / 2, H / 2 + 10, 'Nghỉ ngơi chút nhé! Bé muốn chơi gì không?', 24, INK));
    const opts = stop.options || [];
    opts.forEach((o, k) => {
      const subj = this.island.subjects.find((s) => s.id === o.subject);
      const x = W / 2 + (k - (opts.length - 1) / 2) * 230;
      L.add(button(this, x, H / 2 + 80, 210, 66, subj.title, C.purple, () => {
        const level = stopLevel(this.island, i, o);
        go(this, level.type, { level, journey: { islandId: this.island.id, stop: i, rest: true } });
      }, { size: subj.title.length > 9 ? 20 : 24 }));
    });
    L.add(button(this, W / 2, H / 2 + 160, 220, 62, 'Đi tiếp ▶', C.mint, () => { L.close(); if (first) this.advance(i); }, { size: 26 }));
    this.mascot.say('Trạm nghỉ đây! Bé có thể chơi thư giãn hoặc đi tiếp nhé!');
  }
}
