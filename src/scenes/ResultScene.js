import { W, H, C, INK } from '../config.js';
import { text, button, enter, go, panel, burst, confetti, fit } from '../ui/helpers.js';
import { chibiImage } from '../art/svg.js';
import Save from '../core/SaveManager.js';
import Audio from '../core/AudioManager.js';
import { isLevelUnlocked, nextLevel, findIsland } from '../core/Rewards.js';
import { PASS_STARS } from '../core/Journey.js';

const TITLES = ['', 'Cố lên nhé!', 'Giỏi lắm!', 'Xuất sắc!'];

export default class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  init(data) { this.res = data; }

  create() {
    enter(this);
    const { level, stars, first, journey } = this.res;
    const isBoss = level.type === 'boss';
    const islands = this.registry.get('islands');
    const island = findIsland(islands, level.islandId);
    this.add.image(W / 2, H / 2, 'bg_play');
    panel(this, W / 2, 360, 760, 560, 0xffffff, 0.92);

    // Chặng trên con đường phiêu lưu: cần đủ sao mới được đi tiếp.
    let stop = null, passed = true;
    if (journey && !journey.rest) {
      stop = island.journey.stops[journey.stop];
      passed = Save.recordStop(island.id, journey.stop, stars, island.journey.stops.length).passed;
      if (passed && stop.kind === 'story') Save.addFollower(island.id, stop.npc);
    }

    if (passed) { confetti(this); Audio.win(); } else Audio.tone(392, 0.4, { type: 'triangle', vol: 0.15 });
    let title = isBoss ? 'Chiến thắng!' : TITLES[stars];
    if (stop) title = passed ? 'Qua chặng!' : 'Gần được rồi!';
    text(this, W / 2, 140, title, 72, passed ? '#ff5f93' : '#8a5cd6');
    text(this, W / 2, 205, level.title, 32, '#8a5cd6');
    Audio.speak(title);

    for (let i = 0; i < 3; i++) {
      const x = W / 2 + (i - 1) * 130;
      const y = i === 1 ? 290 : 305;
      this.add.image(x, y, 'star_empty').setScale(1.15);
      if (i < stars) {
        this.time.delayedCall(400 + i * 350, () => {
          const s = this.add.image(x, y, 'star').setScale(0);
          this.tweens.add({ targets: s, scale: 1.15, duration: 300, ease: 'Back.easeOut' });
          Audio.star(i);
          burst(this, x, y, 12);
        });
      }
    }

    let msg = stars === 3 ? 'Bé thật tuyệt vời!' : stars === 2 ? 'Bé làm tốt lắm, thử lại để được 3 sao nhé!' : 'Bé chơi lại để giỏi hơn nhé!';
    if (isBoss && (!stop || stop.kind === 'boss')) {
      msg = `Bé đã đánh bại ${level.title}!\nCây Tri Thức sáng rực rồi!`;
      const opened = islands.find((i) => i.unlock?.boss === level.id);
      if (passed && opened) msg += `\n${opened.name} đã mở!`;
    }
    if (stop && !passed) msg = `Cần ${PASS_STARS} sao để đi tiếp. Bé thử lại nhé, cú Bông tin bé làm được!`;
    else if (stop?.kind === 'story') msg = `${stop.npcName}: "${stop.thanks}"`;
    else if (stop?.kind === 'gate') msg = stop.outro || 'Cổng đã mở rồi!';
    text(this, W / 2, 405, msg, 30, INK, { wordWrap: { width: 680 } });

    if (stop?.kind === 'story' && passed) {
      const npc = fit(this.add.image(1130, 470, stop.npc), 130);
      this.tweens.add({ targets: npc, y: 440, duration: 400, yoyo: true, repeat: -1 });
    } else {
      const owl = this.add.image(1150, 520, 'owl').setScale(0.7);
      this.tweens.add({ targets: owl, angle: { from: -8, to: 8 }, duration: 500, yoyo: true, repeat: -1 });
    }

    if (first && (!stop || stop.kind !== 'gate')) {
      const key = level.sticker || level.icon;
      const st = this.add.image(W / 2 + 290, 160, key).setScale(0);
      text(this, W / 2 + 290, 228, 'Nhãn dán mới!', 22, '#e89a1a');
      this.time.delayedCall(1500, () => {
        const target = 90 / Math.max(st.width, st.height);
        this.tweens.add({ targets: st, scale: target, angle: 360, duration: 600, ease: 'Back.easeOut' });
      });
    }

    const kid = chibiImage(this, 150, 470, Save.player, passed ? 'happy' : 'normal').setScale(0.8);
    this.tweens.add({ targets: kid, y: 440, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const back = { islandId: island.id };
    if (journey) {
      const replay = () => go(this, level.type, { level, journey });
      if (journey.rest) {
        button(this, W / 2 - 130, 540, 230, 84, 'Chơi lại', C.sky, replay, { size: 32 });
        button(this, W / 2 + 130, 540, 230, 84, 'Hành trình', C.yellow, () => go(this, 'Journey', back), { size: 30 });
      } else if (passed) {
        button(this, W / 2 - 130, 540, 230, 84, 'Chơi lại', C.sky, replay, { size: 32 });
        button(this, W / 2 + 130, 540, 230, 84, 'Đi tiếp ▶', C.pink, () => go(this, 'Journey', { ...back, justPassed: journey.stop }), { size: 32 });
      } else {
        button(this, W / 2 - 130, 540, 230, 84, 'Thử lại', C.pink, () => go(this, 'Journey', { ...back, openStop: journey.stop }), { size: 32 });
        button(this, W / 2 + 130, 540, 230, 84, 'Hành trình', C.yellow, () => go(this, 'Journey', back), { size: 30 });
      }
      return;
    }

    const next = nextLevel(island, level);
    const hasNext = next && isLevelUnlocked(island, next);
    const xs = hasNext ? [W / 2 - 240, W / 2, W / 2 + 240] : [W / 2 - 130, W / 2 + 130];
    button(this, xs[0], 540, 210, 84, 'Chơi lại', C.sky, () => go(this, level.type, { level }), { size: 32 });
    button(this, xs[1], 540, 210, 84, 'Bản đồ', C.yellow, () => go(this, 'Map', back), { size: 32 });
    if (hasNext) button(this, xs[2], 540, 210, 84, 'Cấp tiếp', C.pink, () => go(this, next.type, { level: next }), { size: 32 });
  }
}
