import Save from './SaveManager.js';
import { TIERS } from '../config.js';
import { metTiers, PASS_STARS } from './Journey.js';

// Phụ kiện mở khoá theo tổng số sao.
export const ACCESSORIES = [
  { id: 'none', name: 'Không', stars: 0 },
  { id: 'bow', name: 'Nơ', stars: 0 },
  { id: 'hat', name: 'Mũ', stars: 3 },
  { id: 'glasses', name: 'Kính', stars: 6 },
  { id: 'crown', name: 'Vương miện', stars: 12 },
  { id: 'flower', name: 'Hoa', stars: 30 },
  { id: 'shell', name: 'Vỏ sò', stars: 40 },
  { id: 'star', name: 'Kẹp sao', stars: 50 },
  { id: 'mushroom', name: 'Mũ nấm', stars: 60 },
  { id: 'leaf', name: 'Vòng lá', stars: 70 },
  { id: 'wings', name: 'Đôi cánh', stars: 90 },
  { id: 'halo', name: 'Hào quang', stars: 110 },
];

// Mở bằng đủ sao, hoặc nhận sớm từ rương báu trên hành trình.
export const accessoryUnlocked = (a) => Save.totalStars() >= a.stars || (Save.data.unlockedAcc || []).includes(a.id);

// Biến dữ liệu đảo (mỗi môn có "base" + 6 "tiers") thành danh sách màn chơi cụ thể.
export function buildIsland(raw) {
  const subjects = raw.subjects.map((s) => ({
    ...s,
    levels: s.tiers.map((t, k) => ({
      id: `${s.id}-${k + 1}`,
      islandId: raw.id,
      parent: s.id,
      tier: k,
      type: s.type,
      subject: s.subject,
      icon: s.icon,
      title: `${s.title} · ${TIERS[k].name}`,
      config: { ...s.base, ...t },
    })),
  }));
  return { ...raw, subjects, boss: { ...raw.boss, islandId: raw.id } };
}

export const findIsland = (islands, id) => islands.find((i) => i.id === id) || islands[0];

export function islandStars(island) {
  return island.subjects.reduce((n, s) => n + subjectStars(s), 0) + Save.levelStars(island.boss.id);
}

export function islandMaxStars(island) {
  return island.subjects.reduce((n, s) => n + s.levels.length * 3, 0) + 3;
}

// Đảo sau mở khi bé đi hết hành trình đảo trước (hoặc đã thắng Boss của đảo đó với 2 sao).
export function isIslandUnlocked(island) {
  if (!island.unlock) return true;
  return Save.journey(island.unlock.island).done || Save.levelStars(island.unlock.boss) >= PASS_STARS;
}

// Sân luyện tập: một trò mở khi bé đã gặp nó trên hành trình. Các cấp đã gặp trên hành trình mở sẵn;
// cấp cao hơn mở khi cấp ngay trước có sao. Boss mở khi bé đã đi hết hành trình.
export function isLevelUnlocked(island, level) {
  if (level.type === 'boss') return Save.journey(island.id).done || Save.levelStars(level.id) >= PASS_STARS;
  const met = metTiers(island)[level.parent];
  if (met === undefined) return false;
  if (level.tier <= met || Save.levelStars(level.id) > 0) return true;
  const subj = island.subjects.find((s) => s.id === level.parent);
  return Save.levelStars(subj.levels[level.tier - 1].id) > 0;
}

export const subjectMet = (island, subj) => metTiers(island)[subj.id] !== undefined;

export function nextLevel(island, level) {
  if (level.type === 'boss') return null;
  const subj = island.subjects.find((s) => s.id === level.parent);
  return subj.levels[level.tier + 1] || null;
}

export function subjectStars(subj) {
  return subj.levels.reduce((sum, l) => sum + Save.levelStars(l.id), 0);
}

export function starsFromRatio(r, three = 0.9, two = 0.6) {
  return r >= three ? 3 : r >= two ? 2 : 1;
}
