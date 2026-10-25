export const W = 1280;
export const H = 720;
export const FONT = '"Baloo 2", "Nunito", "Segoe UI", sans-serif';
export const INK = '#5b3a5e';

export const C = {
  pink: 0xff8fab,
  yellow: 0xffc94d,
  mint: 0x5fd3a8,
  sky: 0x6cc4ff,
  purple: 0xb48cf0,
  orange: 0xffa45c,
  red: 0xff6b6b,
  cream: 0xfffaf2,
  white: 0xffffff,
  ink: 0x5b3a5e,
  grey: 0xc9c2cc,
};

// 6 cấp độ cho mỗi môn, từ dễ đến khó.
export const TIERS = [
  { name: 'Rất dễ', color: 0x5fd3a8 },
  { name: 'Dễ', color: 0x6cc4ff },
  { name: 'Bình thường', color: 0xffc94d },
  { name: 'Khó', color: 0xffa45c },
  { name: 'Rất khó', color: 0xff6b6b },
  { name: 'Siêu khó', color: 0x9a74e8 },
];

export const SUBJECTS = {
  math: { name: 'Toán', color: C.pink },
  viet: { name: 'Tiếng Việt', color: C.yellow },
  logic: { name: 'Tư duy logic', color: C.mint },
  english: { name: 'Tiếng Anh', color: C.sky },
  art: { name: 'Mỹ thuật', color: C.purple },
  dance: { name: 'Nhảy', color: C.orange },
  reflex: { name: 'Phản xạ', color: C.red },
  time: { name: 'Xem giờ', color: 0x4fc3c9 },
  maze: { name: 'Mê cung', color: 0x8bc34a },
  memory: { name: 'Trí nhớ', color: 0xf48fb1 },
  sort: { name: 'Phân loại', color: 0x26a69a },
  balance: { name: 'Cân thăng bằng', color: 0xffb74d },
  coding: { name: 'Lập trình', color: 0x5c9ded },
  tangram: { name: 'Ghép hình', color: 0xef6c8f },
  sudoku: { name: 'Sudoku', color: 0x7e57c2 },
  mixed: { name: 'Tổng hợp', color: 0x8a7bd8 },
};
