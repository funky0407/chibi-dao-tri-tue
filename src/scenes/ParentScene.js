import { W, H, C, INK, SUBJECTS, TIERS } from '../config.js';
import { subjectStars } from '../core/Rewards.js';
import { text, button, iconButton, enter, go, panel, choiceCard, shake, starsRow, floatText } from '../ui/helpers.js';
import Save from '../core/SaveManager.js';
import Audio from '../core/AudioManager.js';
import { rnd, shuffle } from '../core/QuestionGenerator.js';

// Khu phụ huynh: khoá bằng một phép nhân (trẻ lớp 1 chưa giải được), sau đó xem tiến độ theo môn và theo trạm.
export default class ParentScene extends Phaser.Scene {
  constructor() { super('Parent'); }

  create() {
    enter(this);
    this.add.image(W / 2, H / 2, 'bg_play');
    iconButton(this, 56, 52, 'ic_home', C.pink, () => go(this, 'Menu')).setDepth(10);
    this.layer = null;
    this.showGate();
  }

  fresh() {
    if (this.layer) this.layer.destroy();
    this.layer = this.add.container(0, 0);
    return this.layer;
  }

  showGate() {
    const L = this.fresh();
    const a = rnd(6, 9), b = rnd(6, 9), ans = a * b;
    L.add(panel(this, W / 2, 360, 760, 480, 0xffffff, 0.92));
    L.add(text(this, W / 2, 170, 'Khu vực phụ huynh', 52, '#8a5cd6'));
    L.add(text(this, W / 2, 240, 'Vui lòng trả lời để tiếp tục:', 32, INK));
    L.add(text(this, W / 2, 320, `${a} × ${b} = ?`, 76, '#ff5f93'));
    shuffle([ans, ans + a, ans - b, ans + 2]).forEach((v, k) => {
      const card = choiceCard(this, W / 2 + (k - 1.5) * 170, 470, 150, 110, { label: v, color: C.purple, size: 50 });
      L.add(card);
      card.on('pointerdown', () => {
        if (v === ans) { Audio.correct(); this.showDashboard(); }
        else {
          Audio.wrong();
          shake(this, card);
          this.time.delayedCall(600, () => this.showGate());
        }
      });
    });
  }

  showDashboard(tab = this.tab ?? 0) {
    this.tab = tab;
    const L = this.fresh();
    const islands = this.registry.get('islands');
    const island = islands[tab];
    L.add(text(this, 470, 52, 'Tiến độ học tập của bé', 42, '#ff5f93'));
    // Tab chọn đảo
    islands.forEach((isl, k) => {
      const b = button(this, 820 + k * 95, 52, 88, 52, `Đảo ${k + 1}`, k === tab ? C.pink : C.grey, () => this.showDashboard(k), { size: 20 });
      L.add(b);
    });

    const stats = Save.data.stats;
    const rated = Object.entries(stats)
      .map(([k, s]) => ({ k, total: s.correct + s.wrong, ratio: s.correct / Math.max(1, s.correct + s.wrong) }))
      .filter((s) => s.total >= 3 && SUBJECTS[s.k])
      .sort((x, y) => x.ratio - y.ratio);
    const tip = rated.length
      ? `Gợi ý: bé nên luyện thêm môn ${SUBJECTS[rated[0].k].name}. Tổng số sao: ${Save.totalStars()}`
      : 'Bé chơi thêm vài trạm để có dữ liệu nhé.';
    L.add(text(this, W / 2, 106, tip, 26, '#8a5cd6'));

    L.add(panel(this, 340, 385, 560, 470, 0xffffff, 0.9));
    L.add(text(this, 340, 178, 'Theo môn học', 32, INK));
    const subjList = Object.entries(SUBJECTS);
    const lstep = Math.min(50, 385 / (subjList.length - 1));
    // Nhiều môn thì chữ và thanh nhỏ lại cho vừa khung.
    const lfs = lstep < 36 ? 18 : 24;
    const bh = lstep < 36 ? 16 : 24;
    subjList.forEach(([k, sub], i) => {
      const y = 225 + i * lstep;
      const s = stats[k] || { correct: 0, wrong: 0 };
      const total = s.correct + s.wrong;
      const g = this.add.graphics();
      g.fillStyle(0xeee8f0, 1).fillRoundedRect(250, y - bh / 2, 250, bh, bh / 2);
      if (total) g.fillStyle(sub.color, 1).fillRoundedRect(250, y - bh / 2, Math.max(bh, 250 * s.correct / total), bh, bh / 2);
      L.add([
        text(this, 85, y, sub.name, lfs, INK).setOrigin(0, 0.5),
        g,
        text(this, 520, y, total ? `${s.correct}/${total}` : '–', lfs - 2, INK).setOrigin(0, 0.5),
      ]);
    });

    L.add(panel(this, 940, 385, 560, 470, 0xffffff, 0.9));
    const jr = Save.journey(island.id);
    const total = island.journey.stops.length;
    L.add(text(this, 940, 178, `${island.name} · ${jr.done ? 'Đã đi hết' : `Chặng ${Math.min(jr.reached + 1, total)}/${total}`}`, 28, INK));
    L.add([
      text(this, 950, 212, 'Đã qua cấp', 18, '#8a5cd6'),
      text(this, 1075, 212, 'Sao', 18, '#8a5cd6'),
      text(this, 1165, 212, 'Lượt', 18, '#8a5cd6'),
    ]);
    const rstep = Math.min(47, 365 / island.subjects.length);
    const rfs = rstep < 36 ? 19 : 24;
    island.subjects.forEach((s, i) => {
      const y = 245 + i * rstep;
      const done = s.levels.filter((l) => Save.levelStars(l.id) > 0).length;
      const plays = s.levels.reduce((n, l) => n + Save.levelPlays(l.id), 0);
      L.add([
        text(this, 690, y, s.title, rfs, INK).setOrigin(0, 0.5),
        text(this, 950, y, done ? TIERS[done - 1].name : 'Chưa chơi', rfs - 3, done ? '#4f9e5a' : '#a99bb0'),
        text(this, 1075, y, `${subjectStars(s)}/18`, rfs - 2, '#e89a1a'),
        text(this, 1165, y, `${plays}`, rfs - 3, '#8a5cd6'),
      ]);
    });
    const boss = island.boss;
    L.add([
      text(this, 690, 245 + island.subjects.length * rstep, boss.title, rfs, INK).setOrigin(0, 0.5),
      starsRow(this, 1075, 245 + island.subjects.length * rstep, Save.levelStars(boss.id), rfs),
    ]);

    const st = Save.data.settings;
    const toggle = (x, label, color, get, set) => {
      const b = button(this, x, 668, 250, 70, `${label}: ${get() ? 'Bật' : 'Tắt'}`, color, () => {
        set(!get());
        b.label.setText(`${label}: ${get() ? 'Bật' : 'Tắt'}`);
      }, { size: 24 });
      return b;
    };
    const sound = toggle(170, 'Âm thanh', C.sky, () => Audio.enabled, (v) => { Audio.enabled = v; Save.setSetting('sound', v); });
    const music = toggle(440, 'Nhạc nền', C.purple, () => Audio.musicOn, (v) => { Audio.setMusic(v); Save.setSetting('music', v); });
    const voice = toggle(710, 'Giọng đọc', C.mint, () => Audio.voice, (v) => { Audio.voice = v; Save.setSetting('voice', v); });
    let armed = false;
    const reset = button(this, 1040, 668, 300, 70, 'Xoá tiến độ', C.red, () => {
      if (!armed) {
        armed = true;
        reset.label.setText('Chạm lần nữa để xoá');
        this.time.delayedCall(3000, () => { if (reset.scene) { armed = false; reset.label.setText('Xoá tiến độ'); } });
        return;
      }
      Save.reset();
      this.showDashboard();
      floatText(this, W / 2, 380, 'Đã xoá tiến độ', '#ff6b6b');
    }, { size: 24 });
    L.add([sound, music, voice, reset]);
  }
}
