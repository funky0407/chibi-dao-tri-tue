import { INK } from '../config.js';
import { text } from './helpers.js';
import { rnd, shuffle } from '../core/QuestionGenerator.js';

// Mặt đồng hồ kim vẽ bằng Graphics, kim quay theo giờ/phút (h: 1–12, m: 0–59).
export function clockFace(scene, x, y, r, h, m) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0x5b3a5e, 0.12).fillCircle(4, 6, r + 9);
  g.fillStyle(0xff8fab, 1).fillCircle(0, 0, r + 9);
  g.fillStyle(0xffffff, 1).fillCircle(0, 0, r);
  for (let i = 0; i < 60; i++) {
    const a = (i * Math.PI) / 30;
    const len = i % 5 ? r * 0.05 : r * 0.1;
    g.lineStyle(i % 5 ? 2 : 4, 0x5b3a5e, i % 5 ? 0.5 : 1)
      .lineBetween(Math.sin(a) * (r - 4), -Math.cos(a) * (r - 4), Math.sin(a) * (r - 4 - len), -Math.cos(a) * (r - 4 - len));
  }
  c.add(g);
  for (let n = 1; n <= 12; n++) {
    const a = (n * Math.PI) / 6;
    c.add(text(scene, Math.sin(a) * r * 0.74, -Math.cos(a) * r * 0.74 - 2, String(n), Math.max(14, Math.round(r * 0.2)), INK, { strokeThickness: 0 }));
  }
  const hand = (angle, len, w, color) => {
    const hx = Math.sin(angle) * len, hy = -Math.cos(angle) * len;
    g.lineStyle(w, color, 1).lineBetween(0, 0, hx, hy);
    g.fillStyle(color, 1).fillCircle(hx, hy, w / 2);
  };
  hand((((h % 12) + m / 60) * Math.PI) / 6, r * 0.48, Math.max(5, r * 0.08), 0x5b3a5e);
  hand((m * Math.PI) / 30, r * 0.76, Math.max(3, r * 0.05), 0xe8638c);
  g.fillStyle(0xffd166, 1).fillCircle(0, 0, Math.max(5, r * 0.07));
  return c;
}

// "3 giờ", "3 giờ 15 phút", hoặc "4 giờ kém 15 phút" khi kem = true và phút ≥ 40.
export function timeLabel({ h, m }, kem = false) {
  if (m === 0) return `${h} giờ`;
  if (kem && m >= 40) return `${(h % 12) + 1} giờ kém ${60 - m} phút`;
  return `${h} giờ ${m} phút`;
}

export function randomTime(step) {
  return { h: rnd(1, 12), m: rnd(0, 60 / step - 1) * step };
}

// Đáp án nhiễu dễ nhầm: lệch một bước phút, lệch 1 giờ, hoặc nhầm kim giờ với kim phút.
export function clockChoices(t, n, step, close = false) {
  const wrap = (h) => ((h - 1 + 12) % 12) + 1;
  const near = [
    { h: t.h, m: (t.m + step) % 60 }, { h: t.h, m: (t.m - step + 60) % 60 },
    { h: wrap(t.h + 1), m: t.m }, { h: wrap(t.h - 1), m: t.m },
  ];
  const far = [{ h: t.h, m: (t.m + 30) % 60 }, { h: wrap(t.h + 6), m: t.m }];
  if (t.m && t.m % 5 === 0 && t.m <= 60) far.push({ h: wrap(t.m / 5), m: (t.h % 12) * 5 });
  const pool = close ? shuffle(near).concat(shuffle(far)) : shuffle(near.concat(far));
  const seen = new Set([t.h * 60 + t.m]);
  const out = [t];
  for (const c of pool) {
    const k = c.h * 60 + c.m;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
    if (out.length >= n) break;
  }
  return shuffle(out);
}
