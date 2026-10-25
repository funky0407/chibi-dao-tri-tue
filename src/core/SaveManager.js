import { DEFAULT_PLAYER } from '../art/svg.js';

const KEY = 'chibi-puzzle-save-v1';

const fresh = () => ({
  player: null,
  levels: {},
  stickers: [],
  album: [],
  stats: {},
  settings: { sound: true, music: true, voice: true },
  lastSubject: null,
  journeys: {},
  unlockedAcc: [],
  plays: 0,
});

// Lưu tiến độ trong localStorage. Mọi thao tác đều bọc try/catch để game vẫn chạy khi trình duyệt chặn lưu trữ.
class SaveManager {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = { ...fresh(), ...JSON.parse(raw) };
        data.settings = { ...fresh().settings, ...data.settings };
        // Bản cũ chỉ có 1 màn mỗi môn (vd "g1-math"); bỏ các bản ghi đó vì nay mỗi môn có 6 cấp ("g1-math-1"...).
        for (const id of Object.keys(data.levels)) {
          if (!/-\d$/.test(id) && id !== 'g1-boss') delete data.levels[id];
        }
        return data;
      }
    } catch (e) { /* bỏ qua */ }
    return fresh();
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* bỏ qua */ }
  }

  get player() { return { ...DEFAULT_PLAYER, ...(this.data.player || {}) }; }

  setPlayer(p) {
    this.data.player = { ...p };
    this.save();
  }

  levelStars(id) { return this.data.levels[id]?.stars || 0; }
  levelPlays(id) { return this.data.levels[id]?.plays || 0; }

  recordLevel(id, stars) {
    const prev = this.data.levels[id] || { stars: 0, plays: 0 };
    const first = prev.stars === 0 && stars > 0;
    this.data.levels[id] = { stars: Math.max(prev.stars, stars), plays: prev.plays + 1, last: stars };
    this.data.plays++;
    this.save();
    return { first, improved: stars > prev.stars };
  }

  totalStars() {
    return Object.values(this.data.levels).reduce((s, l) => s + (l.stars || 0), 0);
  }

  addStat(subject, ok) {
    const s = (this.data.stats[subject] ||= { correct: 0, wrong: 0 });
    if (ok) s.correct++; else s.wrong++;
    this.save();
  }

  addSticker(key) {
    if (this.data.stickers.includes(key)) return false;
    this.data.stickers.push(key);
    this.save();
    return true;
  }

  addAlbum(id) {
    if (!this.data.album.includes(id)) this.data.album.push(id);
    this.save();
  }

  setSetting(k, v) {
    this.data.settings[k] = v;
    this.save();
  }

  // Môn chơi gần nhất, lưu riêng cho từng đảo.
  lastSubject(islandId) {
    const ls = this.data.lastSubject;
    return ls && typeof ls === 'object' ? ls[islandId] : null;
  }

  setLastSubject(islandId, id) {
    if (!this.data.lastSubject || typeof this.data.lastSubject !== 'object') this.data.lastSubject = {};
    this.data.lastSubject[islandId] = id;
    this.data.lastIsland = islandId;
    this.save();
  }

  // ---------- Hành trình ----------
  // reached: chặng đang mở xa nhất; stars[i]: sao tốt nhất của chặng i; fails[i]: số lần trượt liên tiếp.
  journey(islandId) {
    const js = (this.data.journeys ||= {});
    return (js[islandId] ||= { reached: 0, done: false, stars: {}, fails: {}, followers: [], seen: [] });
  }

  recordStop(islandId, i, stars, total, need = 2) {
    const j = this.journey(islandId);
    const prev = j.stars[i] || 0;
    j.stars[i] = Math.max(prev, stars);
    const passed = stars >= need;
    if (passed) {
      j.fails[i] = 0;
      if (i === j.reached) j.reached = i + 1;
      if (j.reached >= total) j.done = true;
    } else j.fails[i] = (j.fails[i] || 0) + 1;
    this.save();
    return { passed, firstPass: passed && prev < need };
  }

  addFollower(islandId, npc) {
    const j = this.journey(islandId);
    if (!j.followers.includes(npc)) j.followers.push(npc);
    this.save();
  }

  markSeen(islandId, i) {
    const j = this.journey(islandId);
    if (!j.seen.includes(i)) j.seen.push(i);
    this.save();
  }

  unlockAcc(id) {
    const list = (this.data.unlockedAcc ||= []);
    if (!list.includes(id)) list.push(id);
    this.save();
  }

  reset() {
    const { settings, player } = this.data;
    this.data = { ...fresh(), settings, player };
    this.save();
  }
}

export default new SaveManager();
