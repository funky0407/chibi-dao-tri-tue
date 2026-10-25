export const rnd = (a, b) => Phaser.Math.Between(a, b);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => Phaser.Utils.Array.Shuffle(arr);

export const COUNT_ITEMS = ['strawberry', 'apple', 'banana', 'staritem', 'heart'];

const digits = (n) => String(n).split('').reverse().map(Number);

// "Không nhớ": không hàng nào (đơn vị, chục, trăm) vượt quá 9 khi cộng hay phải mượn khi trừ.
// "mustCarry" (Lớp 2): bắt buộc có nhớ/mượn ở hàng đơn vị.
const addCarries = (a, b) => { const da = digits(a), db = digits(b); return da.some((d, i) => d + (db[i] || 0) >= 10); };
const subBorrows = (a, b) => { const da = digits(a), db = digits(b); return db.some((d, i) => d > (da[i] || 0)); };

function addPair(max, { noCarry, mustCarry } = {}) {
  for (let g = 0; g < 400; g++) {
    const a = rnd(1, max - 1);
    const b = rnd(1, max - a);
    if (noCarry && addCarries(a, b)) continue;
    if (mustCarry && (a % 10) + (b % 10) < 10) continue;
    return [a, b];
  }
  return mustCarry ? [8, 5] : [1, 1];
}

function subPair(max, { noCarry, mustCarry } = {}) {
  for (let g = 0; g < 400; g++) {
    const a = rnd(2, max);
    const b = rnd(1, a - 1);
    if (noCarry && subBorrows(a, b)) continue;
    if (mustCarry && a % 10 >= b % 10) continue;
    return [a, b];
  }
  return mustCarry ? [12, 5] : [2, 1];
}

export function mathQuestion(kind, cfg) {
  const max = cfg.max ?? 10;
  const item = pick(COUNT_ITEMS);
  const tables = cfg.tables || [2, 5];
  if (kind === 'add') {
    const [a, b] = addPair(max, cfg);
    return { kind, a, b, item, answer: a + b, prompt: `${a} + ${b} = ?`, speech: `${a} cộng ${b} bằng mấy?` };
  }
  if (kind === 'sub') {
    const [a, b] = subPair(max, cfg);
    return { kind, a, b, item, answer: a - b, prompt: `${a} − ${b} = ?`, speech: `${a} trừ ${b} bằng mấy?` };
  }
  if (kind === 'missing') {
    const [a, b] = addPair(max, cfg);
    return { kind, a, b, item, answer: b, prompt: `${a} + ? = ${a + b}`, speech: `${a} cộng mấy bằng ${a + b}?` };
  }
  if (kind === 'mul') {
    const a = pick(tables), b = rnd(1, 10);
    return { kind, a, b, item, answer: a * b, prompt: `${a} × ${b} = ?`, speech: `${a} nhân ${b} bằng mấy?` };
  }
  if (kind === 'div') {
    const a = pick(tables), b = rnd(1, 10);
    return { kind, a, b, item, answer: b, prompt: `${a * b} : ${a} = ?`, speech: `${a * b} chia ${a} bằng mấy?` };
  }
  if (kind === 'mulmissing') {
    const a = pick(tables), b = rnd(1, 10);
    return { kind, a, b, item, answer: b, prompt: `${a} × ? = ${a * b}`, speech: `${a} nhân mấy bằng ${a * b}?` };
  }
  if (kind === 'mixmul') {
    const a = pick(tables), b = rnd(2, 10), c = rnd(1, 20);
    return { kind, a, b, c, item, answer: a * b + c, prompt: `${a} × ${b} + ${c} = ?`, speech: `${a} nhân ${b} cộng ${c} bằng mấy?` };
  }
  if (kind === 'chain') {
    const a = rnd(2, 10), b = rnd(1, 9), c = rnd(1, a + b - 1);
    return { kind, a, b, c, item, answer: a + b - c, prompt: `${a} + ${b} − ${c} = ?`, speech: `${a} cộng ${b} trừ ${c} bằng mấy?` };
  }
  const upper = UPPER_KINDS[kind];
  if (upper) return { kind, item, ...upper(cfg) };
  const n = rnd(1, cfg.countMax ?? 10);
  return { kind: 'count', n, item, answer: n, prompt: 'Có bao nhiêu quả?', speech: 'Có bao nhiêu quả?' };
}

// Số thập phân viết kiểu Việt Nam: 2,5 thay vì 2.5
export const dec = (x) => String(+x.toFixed(2)).replace('.', ',');

// Lựa chọn dạng chữ (phân số, số thập phân): đáp án + các lỗi hay gặp, bỏ trùng.
function textChoices(answer, wrongs) {
  const set = new Set([answer]);
  wrongs.forEach((w) => { if (set.size < 3 && w && !w.startsWith('-') && !w.endsWith('/0')) set.add(w); });
  return shuffle([...set]);
}

// Dạng toán lớp 3–5. Dạng có đáp án chữ trả về sẵn "choices".
const UPPER_KINDS = {
  // Lớp 3
  mulBig: () => {
    const a = rnd(11, 500), b = rnd(2, 9);
    return { answer: a * b, prompt: `${a} × ${b} = ?`, speech: `${a} nhân ${b} bằng mấy?` };
  },
  divBig: () => {
    const b = rnd(2, 9), q = rnd(11, 199);
    return { answer: q, prompt: `${b * q} : ${b} = ?`, speech: `${b * q} chia ${b} bằng mấy?` };
  },
  perimeter: () => {
    if (Math.random() < 0.4) {
      const s = rnd(3, 25);
      return { answer: 4 * s, prompt: `Chu vi hình vuông cạnh ${s} cm là bao nhiêu cm?`, wrongs: [s * s, s * 2] };
    }
    const a = rnd(5, 30), b = rnd(2, a - 1);
    return { answer: (a + b) * 2, prompt: `Chu vi hình chữ nhật dài ${a} cm, rộng ${b} cm là bao nhiêu cm?`, wrongs: [a + b, a * b] };
  },
  // Lớp 4
  mul2: () => {
    const a = rnd(11, 49), b = rnd(11, 29);
    return { answer: a * b, prompt: `${a} × ${b} = ?`, speech: `${a} nhân ${b} bằng mấy?` };
  },
  avg: () => {
    const m = rnd(10, 60), d1 = rnd(1, 9), d2 = rnd(1, 9);
    const nums = shuffle([m - d1, m + d2, m + d1 - d2]);
    return { answer: m, prompt: `Trung bình cộng của ${nums[0]}, ${nums[1]} và ${nums[2]} là bao nhiêu?`, wrongs: [m * 3, m + 1] };
  },
  fracAdd: () => {
    const n = rnd(3, 12), a = rnd(1, n - 2), b = rnd(1, n - 1 - a);
    const ans = `${a + b}/${n}`;
    return { answer: ans, prompt: `${a}/${n} + ${b}/${n} = ?`, choices: textChoices(ans, [`${a + b}/${n * 2}`, `${a + b + 1}/${n}`, `${a * b}/${n}`]) };
  },
  fracSub: () => {
    const n = rnd(4, 12), a = rnd(2, n - 1), b = rnd(1, a - 1);
    const ans = `${a - b}/${n}`;
    return { answer: ans, prompt: `${a}/${n} − ${b}/${n} = ?`, choices: textChoices(ans, [`${a + b}/${n}`, `${a - b + 1}/${n}`, `${a - b}/${n + 1}`]) };
  },
  fracOf: () => {
    const d = rnd(2, 9), q = rnd(2, 10), k = rnd(1, d - 1);
    return { answer: k * q, prompt: `${k}/${d} của ${d * q} là bao nhiêu?`, wrongs: [q, d * q - k * q] };
  },
  // Lớp 5
  decAdd: () => {
    const a = rnd(1, 99) / 10, b = rnd(1, 99) / 10, ans = dec(a + b);
    return { answer: ans, prompt: `${dec(a)} + ${dec(b)} = ?`, choices: textChoices(ans, [dec(a + b + 0.1), dec(a + b + 1), dec(Math.abs(a + b - 1))]) };
  },
  decSub: () => {
    const a = rnd(20, 99) / 10, b = rnd(1, Math.round(a * 10) - 1) / 10, ans = dec(a - b);
    return { answer: ans, prompt: `${dec(a)} − ${dec(b)} = ?`, choices: textChoices(ans, [dec(a - b + 0.1), dec(a + b), dec(a - b + 1)]) };
  },
  decMul10: () => {
    const x = rnd(101, 999) / 100, k = pick([10, 100]), ans = dec(x * k);
    return { answer: ans, prompt: `${dec(x)} × ${k} = ?`, choices: textChoices(ans, [dec((x * k) / 10), dec(x * k * 10), dec(x * k + 1)]) };
  },
  percent: () => {
    const p = pick([10, 20, 25, 50, 75]), N = rnd(2, 20) * 20;
    return { answer: (p * N) / 100, prompt: `${p}% của ${N} là bao nhiêu?`, wrongs: [N - (p * N) / 100, p + N] };
  },
  area: () => {
    if (Math.random() < 0.5) {
      const a = rnd(2, 15) * 2, h = rnd(2, 15);
      return { answer: (a * h) / 2, prompt: `Hình tam giác có đáy ${a} cm, chiều cao ${h} cm. Diện tích là bao nhiêu cm²?`, wrongs: [a * h, a + h] };
    }
    // Chiều rộng luôn nhỏ hơn chiều dài để không thành hình vuông.
    const a = rnd(4, 20), b = rnd(2, a - 1);
    return { answer: a * b, prompt: `Hình chữ nhật dài ${a} m, rộng ${b} m. Diện tích là bao nhiêu m²?`, wrongs: [(a + b) * 2, a + b] };
  },
  speed: () => {
    const t = rnd(2, 5), v = rnd(4, 12) * 5;
    return { answer: v, prompt: `Một xe đi ${v * t} km trong ${t} giờ. Vận tốc là bao nhiêu km/giờ?`, wrongs: [v * t * t, v + t] };
  },
};

export function numberChoices(answer, n = 3, min = 0, max = 10) {
  const set = new Set([answer]);
  const offsets = max > 20 ? [-10, -2, -1, 1, 2, 10] : [-3, -2, -1, 1, 2, 3];
  let guard = 0;
  while (set.size < n && guard++ < 60) {
    const d = answer + pick(offsets);
    if (d >= min && d <= max) set.add(d);
  }
  for (let v = min; set.size < n; v++) set.add(v);
  return shuffle([...set]);
}

// Dãy quy luật, ví dụ "AAB" -> A A B A A B A A ?
export function patternRound(type, pool, hideLast = true, nChoices = 3) {
  const letters = [...new Set(type)];
  const nPick = Math.max(nChoices, letters.length + 1);
  const picks = shuffle(pool.slice()).slice(0, nPick);
  const map = {};
  letters.forEach((l, k) => { map[l] = picks[k]; });
  const unit = type.length;
  const total = unit <= 2 ? 6 : unit === 3 ? 9 : 10;
  const seq = Array.from({ length: total }, (_, k) => map[type[k % unit]]);
  const hide = hideLast ? total - 1 : rnd(unit, total - 1);
  const extra = picks.slice(letters.length, letters.length + Math.max(0, nChoices - letters.length));
  const choices = shuffle(letters.map((l) => map[l]).concat(extra));
  return { seq, hide, answer: seq[hide], choices };
}

export function othersFrom(list, exclude, n) {
  return shuffle(list.filter((x) => x !== exclude)).slice(0, n);
}

// Chữ dễ nhầm với nhau, dùng làm chữ gây nhiễu ở cấp khó.
const CONFUSABLE = {
  a: ['ă', 'â'], 'ă': ['a', 'â'], 'â': ['a', 'ă'], o: ['ô', 'ơ'], 'ô': ['o', 'ơ'], 'ơ': ['o', 'ô'],
  e: ['ê'], 'ê': ['e'], u: ['ư'], 'ư': ['u'], d: ['đ', 'b'], 'đ': ['d'], b: ['d', 'p'], p: ['q', 'b'],
  i: ['y'], y: ['i'], n: ['m', 'u'], m: ['n'], g: ['q'], h: ['k'], c: ['k', 'e'], t: ['l', 'f'], r: ['n'], s: ['x'],
  'á': ['à', 'ả', 'a'], 'à': ['á', 'ả'], 'ó': ['ò', 'ỏ', 'o'], 'ò': ['ó', 'ỏ'], 'ỏ': ['ò', 'ó'],
  'è': ['é', 'ẻ'], 'ố': ['ồ', 'ổ', 'ô'], ch: ['tr'], tr: ['ch'], nh: ['ng'], ng: ['nh'], gi: ['d'],
};

export function wordDistractors(tiles, cfg) {
  const pool = cfg.similar
    ? shuffle([...new Set(tiles.flatMap((t) => CONFUSABLE[t] || []))].filter((d) => !tiles.includes(d)))
    : [];
  const generic = shuffle(cfg.distractors.filter((d) => !tiles.includes(d) && !pool.includes(d)));
  return pool.concat(generic).slice(0, cfg.extra ?? 2);
}

// Mục tiêu của trò Hứng quả: một số, hoặc một phép tính có kết quả là số đó.
// cfg.ops: danh sách phép (num, add, sub, mul, div); Đảo 1 dùng cfg.mode (num / add / mix).
const LEGACY_OPS = { num: ['num'], add: ['add'], mix: ['add', 'sub'] };

export function catchTarget(cfg, prev) {
  const max = cfg.max;
  const ops = cfg.ops || LEGACY_OPS[cfg.mode] || ['num'];
  const tables = cfg.tables || [2, 5];
  for (let g = 0; g < 50; g++) {
    const op = pick(ops);
    let t, label, speech;
    if (op === 'num') {
      t = rnd(1, max);
      label = `số ${t}`; speech = label;
    } else if (op === 'add') {
      t = rnd(2, max);
      const a = rnd(1, t - 1);
      label = `${a} + ${t - a}`; speech = `${a} cộng ${t - a}`;
    } else if (op === 'sub') {
      t = rnd(1, max - 1);
      const b = rnd(1, Math.min(9, max - t));
      label = `${t + b} − ${b}`; speech = `${t + b} trừ ${b}`;
    } else if (op === 'mul') {
      const a = pick(tables), b = rnd(1, Math.min(10, Math.floor(max / a)));
      t = a * b;
      label = `${a} × ${b}`; speech = `${a} nhân ${b}`;
    } else {
      const a = pick(tables);
      t = rnd(1, Math.min(10, max));
      label = `${a * t} : ${a}`; speech = `${a * t} chia ${a}`;
    }
    if (t !== prev && t >= 1 && t <= max) return { value: t, op, label, speech };
  }
  return { value: 1, op: 'num', label: 'số 1', speech: 'số 1' };
}

// Dãy số có quy luật: tăng/giảm đều (up/down), bước xen kẽ (alt), bước tăng dần (grow).
export function numberSeq(cfg, hideLast = true) {
  const len = cfg.len ?? 6;
  const kind = pick(cfg.seqKinds || ['up']);
  const steps = cfg.steps || [1, 2];
  const start = rnd(cfg.startMin ?? 0, cfg.startMax ?? 20);
  const seq = [];
  let step = pick(steps);
  if (kind === 'up' || kind === 'down') {
    for (let k = 0; k < len; k++) seq.push(kind === 'up' ? start + step * k : start + step * (len - 1 - k));
  } else if (kind === 'geo') {
    // Dãy nhân: 2, 4, 8, 16...
    const f = pick(cfg.factors || [2]);
    let v = rnd(1, 5);
    for (let k = 0; k < len; k++) { seq.push(v); v *= f; }
    step = seq[1] - seq[0];
  } else if (kind === 'alt') {
    const s2 = pick(steps.filter((s) => s !== step).concat(step + 1));
    let v = start;
    for (let k = 0; k < len; k++) { seq.push(v); v += k % 2 ? s2 : step; }
  } else {
    let v = start, d = rnd(1, 2);
    step = d;
    for (let k = 0; k < len; k++) { seq.push(v); v += d; d++; }
  }
  const hide = hideLast ? len - 1 : rnd(2, len - 2);
  const answer = seq[hide];
  const set = new Set([answer]);
  const n = cfg.choices ?? 3;
  // Dãy nhân: lỗi hay gặp là tưởng dãy cộng đều (cộng thêm hiệu hai số trước).
  if (kind === 'geo' && hide >= 2) {
    const guess = seq[hide - 1] + (seq[hide - 1] - seq[hide - 2]);
    if (guess !== answer && guess >= 0) set.add(guess);
  }
  for (const d of shuffle([step, -step, 1, -1, 2, -2, 10, -10])) {
    if (set.size >= n) break;
    if (answer + d >= 0) set.add(answer + d);
  }
  return { seq, hide, answer, choices: shuffle([...set]) };
}
