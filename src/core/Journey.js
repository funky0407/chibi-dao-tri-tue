import Save from './SaveManager.js';

// Con đường phiêu lưu: mỗi đảo có danh sách chặng (island.journey.stops), bé qua lần lượt.
// Loại chặng: play (đề bài), story (giúp nhân vật phụ), chest (rương báu), rest (trạm nghỉ), gate (cổng thử thách), boss.

export const PASS_STARS = 2;

const subjectOf = (island, id) => island.subjects.find((s) => s.id === id);

export function stopTitle(island, stop) {
  if (stop.kind === 'chest') return 'Rương báu';
  if (stop.kind === 'rest') return stop.name || 'Trạm nghỉ';
  if (stop.kind === 'gate') return stop.name;
  if (stop.kind === 'boss') return island.boss.title;
  if (stop.kind === 'story') return stop.npcName;
  return subjectOf(island, stop.subject).title;
}

export function stopIcon(island, stop) {
  if (stop.kind === 'chest') return 'chest';
  if (stop.kind === 'rest') return 'rainbow';
  if (stop.kind === 'gate') return 'gate';
  if (stop.kind === 'boss') return island.boss.icon;
  if (stop.kind === 'story') return stop.npc;
  return subjectOf(island, stop.subject).icon;
}

// Trượt 2 lần liên tiếp thì lần sau dễ hơn một cấp, để bé không bị kẹt.
export function isEasier(island, i) {
  const stop = island.journey.stops[i];
  return stop.tier > 0 && (Save.journey(island.id).fails[i] || 0) >= 2;
}

export function stopLevel(island, i, option) {
  const stop = island.journey.stops[i];
  if (stop.kind === 'boss') return island.boss;
  if (stop.kind === 'gate') {
    return {
      id: `${island.id}-gate-${i}`, islandId: island.id, type: 'boss', subject: 'mixed', title: stop.name, icon: 'gate',
      config: { ...island.boss.config, hp: stop.hp ?? 3, art: 'gate', intro: stop.intro, outro: stop.outro },
    };
  }
  const pick = option || stop;
  const levels = subjectOf(island, pick.subject).levels;
  return levels[!option && isEasier(island, i) ? pick.tier - 1 : pick.tier];
}

// Các môn bé đã gặp trên hành trình và cấp cao nhất đã gặp: dùng để mở trò trong Sân luyện tập.
export function metTiers(island) {
  const j = Save.journey(island.id);
  const met = {};
  island.journey.stops.forEach((s, i) => {
    if (i > j.reached) return;
    const opts = s.options || (s.subject ? [{ subject: s.subject, tier: s.tier }] : []);
    opts.forEach((o) => { met[o.subject] = Math.max(met[o.subject] ?? -1, o.tier); });
  });
  return met;
}

export const stopPassed = (island, i) => (Save.journey(island.id).stars[i] || 0) >= PASS_STARS;
