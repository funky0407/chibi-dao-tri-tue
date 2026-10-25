// Đồ hoạ chibi vẽ bằng SVG. Mỗi hàm trả về một chuỗi SVG; BootScene biến chúng thành texture của Phaser.
// Muốn thay bằng hình hoạ sĩ vẽ: giữ nguyên tên key và kích thước, chỉ đổi nội dung hình.

const INK = '#4a3348';
const ST = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const ST3 = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

const svg = (w, h, vw, vh, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${vw} ${vh}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
const item = (body) => svg(160, 160, 120, 120, body);
const f1 = (n) => n.toFixed(1);

export const svgURI = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);

function darkHex(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function rng(seed) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

function starPts(cx, cy, R, r, n = 5) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const rad = i % 2 ? r : R;
    pts.push(`${f1(cx + Math.cos(a) * rad)},${f1(cy + Math.sin(a) * rad)}`);
  }
  return pts.join(' ');
}

// Khuôn mặt kawaii dùng chung cho đồ vật và con vật.
function face(cx, cy, s = 1, { mouth = true } = {}) {
  let out = `<circle cx="${f1(cx - 13 * s)}" cy="${cy}" r="${f1(5 * s)}" fill="${INK}"/>
<circle cx="${f1(cx + 13 * s)}" cy="${cy}" r="${f1(5 * s)}" fill="${INK}"/>
<circle cx="${f1(cx - 11.5 * s)}" cy="${f1(cy - 2 * s)}" r="${f1(1.8 * s)}" fill="#fff"/>
<circle cx="${f1(cx + 14.5 * s)}" cy="${f1(cy - 2 * s)}" r="${f1(1.8 * s)}" fill="#fff"/>
<ellipse cx="${f1(cx - 21 * s)}" cy="${f1(cy + 8 * s)}" rx="${f1(5.5 * s)}" ry="${f1(3.2 * s)}" fill="#ff7aa2" opacity=".55"/>
<ellipse cx="${f1(cx + 21 * s)}" cy="${f1(cy + 8 * s)}" rx="${f1(5.5 * s)}" ry="${f1(3.2 * s)}" fill="#ff7aa2" opacity=".55"/>`;
  if (mouth) {
    out += `<path d="M${f1(cx - 5 * s)} ${f1(cy + 7 * s)} Q${cx} ${f1(cy + 12 * s)} ${f1(cx + 5 * s)} ${f1(cy + 7 * s)}" stroke="${INK}" stroke-width="${f1(2.6 * s)}" fill="none" stroke-linecap="round"/>`;
  }
  return out;
}

// ---------- Đồ vật & con vật (160x160) ----------

const strawberry = () => {
  const seeds = [[38, 54], [82, 54], [40, 80], [80, 80], [52, 96], [68, 96]]
    .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="3.4" fill="#ffe08a"/>`).join('');
  return item(`<path d="M60 110 C26 92 12 58 26 40 C38 26 82 26 94 40 C108 58 94 92 60 110Z" fill="#ff5d7a" ${ST}/>
${seeds}<path d="M34 36 L48 32 L52 18 L60 28 L68 18 L72 32 L86 36 L72 42 L60 40 L48 42Z" fill="#5cc98a" ${ST}/>${face(60, 66, 0.9)}`);
};

const apple = () => item(`<path d="M60 38 C44 24 14 32 14 62 C14 94 40 112 60 102 C80 112 106 94 106 62 C106 32 76 24 60 38Z" fill="#ff6b6b" ${ST}/>
<path d="M60 38 Q58 22 66 12" stroke="#8a5a3c" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M66 22 Q82 10 92 20 Q80 32 66 22Z" fill="#5cc98a" ${ST}/>
<ellipse cx="32" cy="54" rx="6" ry="10" fill="#fff" opacity=".45"/>${face(60, 70)}`);

const banana = () => item(`<path d="M18 34 C22 84 66 108 104 84 C108 80 106 76 100 78 C66 76 40 56 32 30 C30 24 18 26 18 34Z" fill="#ffd84d" ${ST}/>
<path d="M18 34 L20 20 L30 22 L32 30Z" fill="#8a5a3c" ${ST3}/>${face(52, 76, 0.7)}`);

const fish = () => item(`<path d="M84 60 L112 38 Q118 60 112 82Z" fill="#4fb3f6" ${ST}/>
<path d="M40 36 Q56 16 72 34" fill="#4fb3f6" ${ST}/>
<ellipse cx="54" cy="60" rx="42" ry="30" fill="#6ec6ff" ${ST}/>
<path d="M70 46 Q80 60 70 74" stroke="#4fb3f6" stroke-width="4" fill="none" stroke-linecap="round"/>
<circle cx="14" cy="22" r="5" fill="none" stroke="#6ec6ff" stroke-width="3"/><circle cx="24" cy="10" r="3" fill="none" stroke="#6ec6ff" stroke-width="3"/>
${face(44, 58, 0.9)}`);

const chicken = () => item(`<circle cx="50" cy="26" r="8" fill="#ff6b6b" ${ST3}/><circle cx="62" cy="20" r="9" fill="#ff6b6b" ${ST3}/><circle cx="73" cy="27" r="7" fill="#ff6b6b" ${ST3}/>
<path d="M48 102 l-6 12 M48 102 l0 13 M48 102 l6 12 M72 102 l-6 12 M72 102 l0 13 M72 102 l6 12" stroke="#ff9f43" stroke-width="5" stroke-linecap="round"/>
<path d="M24 64 Q8 82 28 92 Q36 80 32 66Z" fill="#ffd23f" ${ST}/><path d="M96 64 Q112 82 92 92 Q84 80 88 66Z" fill="#ffd23f" ${ST}/>
<circle cx="60" cy="66" r="40" fill="#ffe066" ${ST}/>
<path d="M53 68 L67 68 L60 79Z" fill="#ff9f43" ${ST3}/>${face(60, 58, 1, { mouth: false })}`);

const cow = () => item(`<path d="M32 34 Q22 16 34 12 Q38 24 42 30Z" fill="#fff3d6" ${ST3}/><path d="M88 34 Q98 16 86 12 Q82 24 78 30Z" fill="#fff3d6" ${ST3}/>
<ellipse cx="18" cy="48" rx="13" ry="8" fill="#ffffff" ${ST3}/><ellipse cx="102" cy="48" rx="13" ry="8" fill="#ffffff" ${ST3}/>
<rect x="22" y="24" width="76" height="84" rx="36" fill="#ffffff" ${ST}/>
<path d="M28 44 Q36 30 50 38 Q46 54 30 52Z" fill="#5b4a5e"/><ellipse cx="82" cy="40" rx="9" ry="7" fill="#5b4a5e"/>
<ellipse cx="60" cy="88" rx="30" ry="17" fill="#ffc2d1" ${ST3}/>
<ellipse cx="50" cy="88" rx="4" ry="5" fill="${INK}"/><ellipse cx="70" cy="88" rx="4" ry="5" fill="${INK}"/>
${face(60, 62, 1, { mouth: false })}`);

const cat = () => item(`<path d="M22 50 L26 12 L54 32Z" fill="#ffb26b" ${ST}/><path d="M98 50 L94 12 L66 32Z" fill="#ffb26b" ${ST}/>
<path d="M30 40 L31 22 L45 32Z" fill="#ffc2d1"/><path d="M90 40 L89 22 L75 32Z" fill="#ffc2d1"/>
<ellipse cx="60" cy="68" rx="46" ry="38" fill="#ffb26b" ${ST}/>
<path d="M52 32 L54 42 M60 30 L60 42 M68 32 L66 42" stroke="#e8893f" stroke-width="4" stroke-linecap="round"/>
<path d="M18 74 L4 70 M18 82 L4 84 M102 74 L116 70 M102 82 L116 84" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
<path d="M57 72 L63 72 L60 75Z" fill="#ff7aa2"/>${face(60, 66)}`);

const dog = () => item(`<ellipse cx="22" cy="60" rx="14" ry="27" fill="#a86b45" ${ST} transform="rotate(15 22 60)"/>
<ellipse cx="98" cy="60" rx="14" ry="27" fill="#a86b45" ${ST} transform="rotate(-15 98 60)"/>
<ellipse cx="60" cy="62" rx="40" ry="40" fill="#e8c39e" ${ST}/>
<ellipse cx="76" cy="46" rx="13" ry="12" fill="#c99a6e"/>
<ellipse cx="60" cy="82" rx="19" ry="14" fill="#fff4e6"/>
<ellipse cx="60" cy="75" rx="7" ry="5" fill="${INK}"/>
<path d="M57 87 Q60 98 63 87Z" fill="#ff7aa2"/>
<path d="M53 85 Q60 90 67 85" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
${face(60, 58, 1, { mouth: false })}`);

const flower = () => {
  let petals = '';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    petals += `<circle cx="${f1(60 + Math.cos(a) * 24)}" cy="${f1(46 + Math.sin(a) * 24)}" r="17" fill="#ff8fab" ${ST}/>`;
  }
  return item(`<path d="M60 64 Q56 92 60 116" stroke="#4caf6e" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M58 98 Q36 82 28 98 Q42 110 58 98Z" fill="#5cc98a" ${ST}/>
${petals}<circle cx="60" cy="46" r="17" fill="#ffd166" ${ST}/>${face(60, 46, 0.6)}`);
};

const tree = () => {
  const blobs = [[38, 56, 24], [82, 56, 24], [60, 40, 30]];
  const outline = blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#5cc98a" ${ST}/>`).join('');
  const fill = blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 2}" fill="#5cc98a"/>`).join('');
  return item(`<path d="M50 70 L46 112 L74 112 L70 70Z" fill="#b07b52" ${ST}/>${outline}${fill}
<circle cx="34" cy="66" r="5" fill="#ff6b6b"/><circle cx="88" cy="46" r="5" fill="#ff6b6b"/><circle cx="74" cy="22" r="4" fill="#ff6b6b"/>${face(60, 50, 0.8)}`);
};

const house = () => item(`<rect x="78" y="20" width="14" height="28" fill="#c08552" ${ST3}/>
<rect x="24" y="56" width="72" height="54" rx="6" fill="#ffd6a5" ${ST}/>
<path d="M12 62 L60 20 L108 62Z" fill="#ff7b9c" ${ST}/>
<rect x="50" y="78" width="20" height="32" rx="8" fill="#b07b52" ${ST3}/>
<rect x="30" y="70" width="15" height="15" rx="3" fill="#a0d8ff" ${ST3}/><rect x="75" y="70" width="15" height="15" rx="3" fill="#a0d8ff" ${ST3}/>`);

const sun = () => {
  let rays = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    rays += `<line x1="${f1(60 + Math.cos(a) * 41)}" y1="${f1(60 + Math.sin(a) * 41)}" x2="${f1(60 + Math.cos(a) * 54)}" y2="${f1(60 + Math.sin(a) * 54)}" stroke="#ffb84d" stroke-width="9" stroke-linecap="round"/>`;
  }
  return item(`${rays}<circle cx="60" cy="60" r="32" fill="#ffd84d" ${ST}/>${face(60, 60, 0.95)}`);
};

const moon = () => item(`<path d="M57.2 20 A44 44 0 1 0 98 77.2 A36 36 0 0 1 57.2 20Z" fill="#ffe58f" ${ST}/>
<circle cx="96" cy="24" r="4" fill="#ffe58f"/><circle cx="108" cy="46" r="3" fill="#ffe58f"/>${face(38, 80, 0.7)}`);

const staritem = () => item(`<polygon points="${starPts(60, 64, 52, 24)}" fill="#ffd166" ${ST}/>${face(60, 68, 0.8)}`);

const heart = () => item(`<path d="M60 106 C20 80 8 56 20 36 C32 18 54 22 60 40 C66 22 88 18 100 36 C112 56 100 80 60 106Z" fill="#ff7aa2" ${ST}/>
<ellipse cx="34" cy="44" rx="6" ry="9" fill="#fff" opacity=".45"/>${face(60, 62, 0.85)}`);

const note = () => item(`<path d="M44 90 L44 28 L96 16 L96 78" stroke="${INK}" stroke-width="7" fill="none" stroke-linejoin="round"/>
<path d="M44 28 L96 16 L96 32 L44 44Z" fill="${INK}"/>
<ellipse cx="32" cy="92" rx="16" ry="12" fill="#b48cf0" ${ST}/><ellipse cx="84" cy="80" rx="16" ry="12" fill="#ff8fab" ${ST}/>
${face(32, 91, 0.45)}${face(84, 79, 0.45)}`);

const basket = () => svg(220, 151, 160, 110, `<path d="M30 52 Q80 -12 130 52" stroke="#b07b52" stroke-width="9" fill="none" stroke-linecap="round"/>
<path d="M12 48 L148 48 L132 102 Q80 110 28 102Z" fill="#e7a86b" ${ST}/>
<path d="M18 66 L142 66 M23 84 L137 84" stroke="#c4834a" stroke-width="4"/>
<path d="M44 52 L48 104 M68 52 L70 106 M92 52 L90 106 M116 52 L112 104" stroke="#c4834a" stroke-width="4"/>
<rect x="6" y="40" width="148" height="16" rx="8" fill="#d48f52" ${ST}/>
<path d="M134 48 L150 38 L148 58Z M134 48 L118 38 L120 58Z" fill="#ff8fab" ${ST3}/><circle cx="134" cy="48" r="5" fill="#ffb3c8" ${ST3}/>`);

// ---------- Đồ vật & con vật Lớp 2 ----------

const pencil = () => item(`<g transform="rotate(-40 60 60)">
<rect x="18" y="48" width="66" height="24" fill="#ffd23f" ${ST}/><rect x="21" y="51" width="60" height="6" fill="#ffe680"/>
<path d="M84 48 L108 60 L84 72Z" fill="#ffd9b0" ${ST}/><path d="M100 56 L108 60 L100 64Z" fill="${INK}"/>
<rect x="6" y="48" width="14" height="24" rx="5" fill="#ff8fab" ${ST}/>${face(50, 60, 0.5)}</g>`);

const book = () => item(`<path d="M6 36 L60 42 L114 36 L114 104 L60 110 L6 104Z" fill="#6cc4ff" ${ST}/>
<path d="M12 30 Q36 22 60 34 L60 102 Q36 92 12 98Z" fill="#fff" ${ST}/>
<path d="M108 30 Q84 22 60 34 L60 102 Q84 92 108 98Z" fill="#fff" ${ST}/>
<path d="M72 50 Q86 44 98 48 M72 62 Q86 56 98 60 M72 74 Q86 68 98 72" stroke="#c9c2cc" stroke-width="3" fill="none" stroke-linecap="round"/>
${face(36, 62, 0.6)}`);

const bag = () => item(`<path d="M42 30 Q42 12 60 12 Q78 12 78 30" stroke="${INK}" stroke-width="6" fill="none"/>
<rect x="22" y="28" width="76" height="82" rx="20" fill="#ff6b6b" ${ST}/>
<path d="M22 52 Q60 66 98 52 L98 48 Q98 28 78 28 L42 28 Q22 28 22 48Z" fill="#e85555" ${ST}/>
<rect x="38" y="72" width="44" height="30" rx="10" fill="#ffd166" ${ST}/><circle cx="60" cy="57" r="5" fill="#ffd166" ${ST3}/>
${face(60, 85, 0.6)}`);

const ball = () => item(`<circle cx="60" cy="60" r="46" fill="#fff"/>
<path d="M60 14 A46 46 0 0 1 106 60 L60 60Z" fill="#ff6b6b"/><path d="M106 60 A46 46 0 0 1 60 106 L60 60Z" fill="#ffd166"/>
<path d="M60 106 A46 46 0 0 1 14 60 L60 60Z" fill="#6cc4ff"/>
<circle cx="60" cy="60" r="46" fill="none" ${ST}/><ellipse cx="40" cy="36" rx="8" ry="5" fill="#fff" opacity=".7" transform="rotate(-35 40 36)"/>
${face(60, 62, 0.8)}`);

const car = () => item(`<path d="M10 82 L14 62 Q18 54 30 54 L42 54 L54 36 Q58 32 66 32 L86 32 Q92 32 96 38 L104 54 Q112 56 112 66 L112 82Z" fill="#ff6b6b" ${ST}/>
<path d="M58 40 L66 38 L76 38 L76 54 L50 54Z" fill="#a0d8ff" ${ST3}/><path d="M82 38 L88 38 L96 54 L82 54Z" fill="#a0d8ff" ${ST3}/>
<circle cx="36" cy="84" r="14" fill="#5b4a5e" ${ST}/><circle cx="36" cy="84" r="5" fill="#ddd"/>
<circle cx="90" cy="84" r="14" fill="#5b4a5e" ${ST}/><circle cx="90" cy="84" r="5" fill="#ddd"/>
<circle cx="107" cy="66" r="4" fill="#ffd166"/>${face(40, 68, 0.55)}`);

const chair = () => item(`<rect x="30" y="12" width="56" height="52" rx="10" fill="#c08552" ${ST}/>
<rect x="38" y="20" width="40" height="34" rx="6" fill="#d9a074"/>
<rect x="28" y="74" width="10" height="38" rx="3" fill="#a86b45" ${ST3}/><rect x="82" y="74" width="10" height="38" rx="3" fill="#a86b45" ${ST3}/>
<rect x="22" y="62" width="76" height="14" rx="5" fill="#a86b45" ${ST}/>${face(58, 36, 0.6)}`);

const bird = () => item(`<path d="M22 66 L4 52 L8 80Z" fill="#4fa3e8" ${ST}/>
<path d="M50 98 l0 13 M64 98 l0 13" stroke="#ffb347" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="56" cy="66" rx="38" ry="32" fill="#6cc4ff" ${ST}/>
<ellipse cx="62" cy="80" rx="22" ry="14" fill="#e8f6ff"/>
<path d="M60 36 Q64 22 74 28 Q66 32 67 38Z" fill="#4fa3e8" ${ST3}/>
<path d="M34 66 Q50 50 62 68 Q48 82 34 66Z" fill="#4fa3e8" ${ST3}/>
<path d="M92 58 L112 64 L92 71Z" fill="#ffb347" ${ST3}/>${face(74, 56, 0.6, { mouth: false })}`);

const duck = () => item(`<path d="M2 104 Q18 96 34 104 T66 104 T98 104 T120 104" stroke="#8ec5ff" stroke-width="5" fill="none"/>
<path d="M16 70 L4 56 L24 62Z" fill="#ffe066" ${ST3}/>
<ellipse cx="54" cy="78" rx="40" ry="24" fill="#ffe066" ${ST}/>
<circle cx="80" cy="42" r="22" fill="#ffe066" ${ST}/>
<path d="M98 40 Q116 42 113 50 Q104 55 96 50Z" fill="#ff9f43" ${ST3}/>
<path d="M34 72 Q52 60 66 76 Q50 88 34 72Z" fill="#ffd23f" ${ST3}/>${face(78, 38, 0.6, { mouth: false })}`);

const pig = () => item(`<path d="M24 36 L28 10 L48 28Z" fill="#ff9fbf" ${ST}/><path d="M96 36 L92 10 L72 28Z" fill="#ff9fbf" ${ST}/>
<ellipse cx="60" cy="64" rx="46" ry="42" fill="#ffb3c8" ${ST}/>
<ellipse cx="60" cy="78" rx="18" ry="13" fill="#ff8fab" ${ST3}/>
<ellipse cx="54" cy="78" rx="3.5" ry="5" fill="${INK}"/><ellipse cx="66" cy="78" rx="3.5" ry="5" fill="${INK}"/>
<path d="M54 96 Q60 100 66 96" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
${face(60, 56, 1, { mouth: false })}`);

const rabbit = () => item(`<ellipse cx="42" cy="32" rx="11" ry="28" fill="#fff" ${ST}/><ellipse cx="42" cy="34" rx="5" ry="19" fill="#ffc2d1"/>
<ellipse cx="78" cy="32" rx="11" ry="28" fill="#fff" ${ST}/><ellipse cx="78" cy="34" rx="5" ry="19" fill="#ffc2d1"/>
<circle cx="60" cy="76" r="38" fill="#fff" ${ST}/>
<path d="M57 76 L63 76 L60 79Z" fill="#ff7aa2"/>${face(60, 72)}
<rect x="56" y="83" width="8" height="8" rx="2" fill="#fff" ${ST3}/>`);

const sunflower = () => {
  let petals = '';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const x = f1(60 + Math.cos(a) * 26), y = f1(46 + Math.sin(a) * 26);
    petals += `<ellipse cx="${x}" cy="${y}" rx="12" ry="7" fill="#ffd23f" ${ST3} transform="rotate(${i * 30} ${x} ${y})"/>`;
  }
  return item(`<path d="M60 70 Q56 96 60 118" stroke="#4caf6e" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M58 100 Q36 84 28 100 Q42 112 58 100Z" fill="#5cc98a" ${ST}/>
${petals}<circle cx="60" cy="46" r="19" fill="#a0683f" ${ST}/>${face(60, 46, 0.6)}`);
};

const clockIcon = () => {
  let ticks = '';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ticks += `<circle cx="${f1(60 + Math.cos(a) * 36)}" cy="${f1(64 + Math.sin(a) * 36)}" r="${i % 3 ? 2 : 3.5}" fill="${INK}"/>`;
  }
  return item(`<circle cx="28" cy="22" r="13" fill="#ff8fab" ${ST3}/><circle cx="92" cy="22" r="13" fill="#ff8fab" ${ST3}/>
<path d="M34 102 l-8 12 M86 102 l8 12" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
<circle cx="60" cy="64" r="46" fill="#fff" ${ST}/>${ticks}
<path d="M60 64 L60 36 M60 64 L80 72" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="64" r="5" fill="#ff6b6b"/>`);
};

// Biểu tượng cho các trò mới: lật thẻ, phân loại, cân thăng bằng, robot.
const cards = () => item(`<g transform="rotate(-14 46 61)"><rect x="18" y="22" width="56" height="78" rx="10" fill="#b48cf0" ${ST}/>
<polygon points="${starPts(46, 61, 14, 6)}" fill="#fff"/></g>
<g transform="rotate(10 74 62)"><rect x="46" y="24" width="56" height="78" rx="10" fill="#fff" ${ST}/>
<path d="M74 80 C58 70 55 57 62 50 C67 45 72 48 74 54 C76 48 81 45 86 50 C93 57 90 70 74 80Z" fill="#ff7aa2"/></g>`);

const boxes = () => item(`<circle cx="30" cy="54" r="13" fill="#ff6b6b" ${ST3}/><ellipse cx="90" cy="54" rx="15" ry="10" fill="#6ec6ff" ${ST3}/>
<path d="M8 66 L54 66 L50 108 L12 108Z" fill="#ffa45c" ${ST}/><path d="M8 66 L2 56 L48 56 L54 66Z" fill="#ffc285" ${ST3}/>
<path d="M66 66 L112 66 L108 108 L70 108Z" fill="#5fd3a8" ${ST}/><path d="M66 66 L72 56 L118 56 L112 66Z" fill="#9be7c4" ${ST3}/>`);

const scaleIcon = () => item(`<path d="M20 42 L8 74 M20 42 L32 74 M100 42 L88 74 M100 42 L112 74" stroke="${INK}" stroke-width="2.5"/>
<path d="M54 104 L66 104 L63 40 L57 40Z" fill="#c08552" ${ST3}/>
<rect x="36" y="100" width="48" height="12" rx="6" fill="#a86b45" ${ST3}/>
<rect x="12" y="32" width="96" height="10" rx="5" fill="#ffd166" ${ST3}/><circle cx="60" cy="37" r="8" fill="#ff8fab" ${ST3}/>
<path d="M4 74 Q20 92 36 74Z" fill="#8fd3ff" ${ST3}/><path d="M84 74 Q100 92 116 74Z" fill="#8fd3ff" ${ST3}/>`);

// ---------- Nhân vật & đồ vật Đảo 3–5 ----------

const turtle = () => item(`<ellipse cx="28" cy="88" rx="11" ry="8" fill="#8bd17c" ${ST3}/><ellipse cx="92" cy="88" rx="11" ry="8" fill="#8bd17c" ${ST3}/>
<ellipse cx="36" cy="106" rx="11" ry="8" fill="#8bd17c" ${ST3}/><ellipse cx="84" cy="106" rx="11" ry="8" fill="#8bd17c" ${ST3}/>
<circle cx="60" cy="30" r="21" fill="#8bd17c" ${ST}/>
<ellipse cx="60" cy="76" rx="46" ry="32" fill="#5cc98a" ${ST}/>
<path d="M40 64 L60 54 L80 64 L80 86 L60 96 L40 86Z" fill="#7ed957" ${ST3}/>${face(60, 28, 0.65)}`);

const crab = () => item(`<path d="M30 80 l-18 8 M28 92 l-18 14 M90 80 l18 8 M92 92 l18 14" stroke="#e85555" stroke-width="6" stroke-linecap="round"/>
<path d="M38 66 L24 50 M82 66 L96 50" stroke="#e85555" stroke-width="7" stroke-linecap="round"/>
<path d="M8 44 Q8 26 22 26 Q34 28 30 40 L22 40 L28 48 Q12 58 8 44Z" fill="#ff6b6b" ${ST3}/>
<path d="M112 44 Q112 26 98 26 Q86 28 90 40 L98 40 L92 48 Q108 58 112 44Z" fill="#ff6b6b" ${ST3}/>
<path d="M50 54 L46 36 M70 54 L74 36" stroke="${INK}" stroke-width="3"/>
<circle cx="46" cy="32" r="7" fill="#fff" ${ST3}/><circle cx="74" cy="32" r="7" fill="#fff" ${ST3}/><circle cx="47" cy="33" r="3.5" fill="${INK}"/><circle cx="73" cy="33" r="3.5" fill="${INK}"/>
<ellipse cx="60" cy="76" rx="36" ry="26" fill="#ff6b6b" ${ST}/>
<ellipse cx="42" cy="80" rx="6" ry="3.5" fill="#ffc2d1" opacity=".8"/><ellipse cx="78" cy="80" rx="6" ry="3.5" fill="#ffc2d1" opacity=".8"/>
<path d="M52 82 Q60 90 68 82" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`);

const frog = () => item(`<ellipse cx="32" cy="106" rx="16" ry="8" fill="#5cc98a" ${ST3}/><ellipse cx="88" cy="106" rx="16" ry="8" fill="#5cc98a" ${ST3}/>
<ellipse cx="60" cy="72" rx="46" ry="36" fill="#7ed957" ${ST}/><ellipse cx="60" cy="88" rx="26" ry="16" fill="#c5f0a4"/>
<circle cx="38" cy="40" r="16" fill="#7ed957" ${ST}/><circle cx="82" cy="40" r="16" fill="#7ed957" ${ST}/>
<circle cx="38" cy="40" r="9" fill="#fff"/><circle cx="82" cy="40" r="9" fill="#fff"/><circle cx="39" cy="41" r="5" fill="${INK}"/><circle cx="81" cy="41" r="5" fill="${INK}"/>
<path d="M36 70 Q60 88 84 70" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<ellipse cx="28" cy="66" rx="6" ry="3.5" fill="#ff7aa2" opacity=".55"/><ellipse cx="92" cy="66" rx="6" ry="3.5" fill="#ff7aa2" opacity=".55"/>`);

const squirrel = () => item(`<path d="M76 98 Q118 82 106 40 Q98 12 74 22 Q96 32 90 56 Q84 76 68 86Z" fill="#c07a45" ${ST}/>
<ellipse cx="50" cy="88" rx="26" ry="24" fill="#d99a62" ${ST}/><ellipse cx="50" cy="94" rx="14" ry="14" fill="#f6e0c4"/>
<path d="M28 36 L32 12 L46 28Z" fill="#d99a62" ${ST3}/><path d="M72 36 L68 12 L54 28Z" fill="#d99a62" ${ST3}/>
<circle cx="50" cy="50" r="26" fill="#d99a62" ${ST}/>
<ellipse cx="50" cy="60" rx="10" ry="7" fill="#f6e0c4"/>${face(50, 50, 0.8)}`);

const bee = () => item(`<ellipse cx="44" cy="34" rx="15" ry="22" fill="#e8f6ff" ${ST3} transform="rotate(-20 44 34)"/>
<ellipse cx="74" cy="32" rx="15" ry="22" fill="#e8f6ff" ${ST3} transform="rotate(20 74 32)"/>
<path d="M100 66 L114 62 L100 76Z" fill="${INK}"/>
<ellipse cx="60" cy="68" rx="42" ry="32" fill="#ffd23f" ${ST}/>
<path d="M78 38 Q84 68 78 98 M92 46 Q97 68 92 90" stroke="${INK}" stroke-width="7" fill="none"/>
<path d="M36 42 Q30 24 22 22 M50 38 Q48 20 42 14" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="22" cy="22" r="4" fill="${INK}"/><circle cx="42" cy="14" r="4" fill="${INK}"/>${face(44, 66, 0.75)}`);

const coral = () => item(`<ellipse cx="60" cy="110" rx="32" ry="8" fill="#c9c2cc" ${ST3}/>
<path d="M60 108 L60 60 M60 82 L38 56 M38 56 L32 32 M38 56 L48 32 M60 72 L84 48 M84 48 L80 24 M84 48 L100 36" stroke="${INK}" stroke-width="16" stroke-linecap="round" fill="none"/>
<path d="M60 108 L60 60 M60 82 L38 56 M38 56 L32 32 M38 56 L48 32 M60 72 L84 48 M84 48 L80 24 M84 48 L100 36" stroke="#ff8fab" stroke-width="10" stroke-linecap="round" fill="none"/>
<circle cx="60" cy="88" r="3" fill="#fff"/><circle cx="44" cy="62" r="2.5" fill="#fff"/><circle cx="84" cy="56" r="2.5" fill="#fff"/>`);

const shell = () => item(`<path d="M50 98 L70 98 L66 110 L54 110Z" fill="#ff9fbf" ${ST3}/>
<path d="M60 100 L16 54 Q60 6 104 54Z" fill="#ffb3c8" ${ST}/>
<path d="M60 100 L30 44 M60 100 L44 32 M60 100 L60 28 M60 100 L76 32 M60 100 L90 44" stroke="#ff8fab" stroke-width="3"/>${face(60, 66, 0.55)}`);

const mushroom = () => item(`<rect x="44" y="62" width="32" height="46" rx="12" fill="#fff3e0" ${ST}/>
<path d="M10 70 Q14 16 60 14 Q106 16 110 70Z" fill="#ff6b6b" ${ST}/>
<circle cx="36" cy="44" r="8" fill="#fff"/><circle cx="64" cy="30" r="7" fill="#fff"/><circle cx="88" cy="50" r="9" fill="#fff"/><circle cx="58" cy="56" r="5" fill="#fff"/>
${face(60, 84, 0.55)}`);

// Boss Đảo 3: Mực Khổng Lồ.
function boss3SVG(happy) {
  const fill = happy ? '#ffb3d9' : '#9b6be0';
  let b = '';
  for (let k = 0; k < 6; k++) {
    const x = 52 + k * 28;
    const d = `M${x} 108 q -12 26 0 42 q 10 14 -6 20`;
    b += `<path d="${d}" stroke="${INK}" stroke-width="20" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${fill}" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  }
  b += `<path d="M40 118 Q30 18 122 12 Q214 18 204 118 Z" fill="${fill}" ${ST}/>
<circle cx="80" cy="44" r="9" fill="#fff" opacity=".35"/><circle cx="168" cy="40" r="7" fill="#fff" opacity=".35"/><circle cx="186" cy="70" r="6" fill="#fff" opacity=".35"/>`;
  if (happy) {
    b += `<path d="M90 80 Q102 68 114 80 M130 80 Q142 68 154 80" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M108 96 Q122 112 136 96Z" fill="#ff7aa2" ${ST3}/>
<ellipse cx="84" cy="96" rx="10" ry="5" fill="#ff7aa2" opacity=".6"/><ellipse cx="160" cy="96" rx="10" ry="5" fill="#ff7aa2" opacity=".6"/>`;
  } else {
    b += `<path d="M84 62 L108 72 M160 62 L136 72" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
<circle cx="100" cy="84" r="11" fill="#fff"/><circle cx="144" cy="84" r="11" fill="#fff"/>
<circle cx="102" cy="86" r="6" fill="${INK}"/><circle cx="142" cy="86" r="6" fill="${INK}"/>
<path d="M110 108 Q122 98 134 108" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M214 120 q-8 12 0 16 q8 -4 0 -16Z M226 96 q-6 10 0 13 q6 -3 0 -13Z" fill="${INK}"/>`;
  }
  return svg(336, 238, 244, 172, b);
}

// Boss Đảo 4: Vua Nấm Cáu Kỉnh.
function boss4SVG(happy) {
  const cap = happy ? '#ff9f6b' : '#a04ad8';
  let b = `<rect x="82" y="80" width="80" height="86" rx="26" fill="#fff3e0" ${ST}/>
<path d="M18 98 Q20 14 122 10 Q224 14 226 98 Q122 114 18 98Z" fill="${cap}" ${ST}/>
<circle cx="64" cy="58" r="12" fill="#fff"/><circle cx="118" cy="36" r="10" fill="#fff"/><circle cx="176" cy="54" r="13" fill="#fff"/><circle cx="148" cy="80" r="7" fill="#fff"/><circle cx="92" cy="82" r="6" fill="#fff"/>
<path d="M104 12 L100 -2 L112 6 L122 -6 L132 6 L144 -2 L140 12Z" fill="#ffd34d" ${ST3}/>`;
  if (happy) {
    b += `<path d="M100 120 Q108 112 116 120 M128 120 Q136 112 144 120" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M112 136 Q122 148 132 136Z" fill="#ff7aa2" ${ST3}/>
<ellipse cx="96" cy="136" rx="8" ry="4" fill="#ff7aa2" opacity=".6"/><ellipse cx="148" cy="136" rx="8" ry="4" fill="#ff7aa2" opacity=".6"/>`;
  } else {
    b += `<path d="M96 110 L114 118 M148 110 L130 118" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
<circle cx="108" cy="126" r="7" fill="${INK}"/><circle cx="136" cy="126" r="7" fill="${INK}"/>
<path d="M112 150 Q122 142 132 150" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
<circle cx="40" cy="128" r="6" fill="#c9a0f0" opacity=".7"/><circle cx="206" cy="132" r="8" fill="#c9a0f0" opacity=".7"/><circle cx="218" cy="112" r="5" fill="#c9a0f0" opacity=".7"/>`;
  }
  return svg(336, 238, 244, 172, b);
}

// Boss Đảo 5: Rồng Sấm Sét.
function boss5SVG(happy) {
  const body = happy ? '#9be7c4' : '#6d7191';
  const wing = happy ? '#c8a8ff' : '#4f5270';
  const wingL = 'M70 92 L12 40 L34 92 L8 108 L66 116Z';
  const wingR = 'M174 92 L232 40 L210 92 L236 108 L178 116Z';
  let b = `<path d="${wingL}" fill="${wing}" ${ST}/><path d="${wingR}" fill="${wing}" ${ST}/>
<ellipse cx="122" cy="124" rx="56" ry="42" fill="${body}" ${ST}/><ellipse cx="122" cy="134" rx="34" ry="26" fill="#fff3c4"/>
<path d="M92 34 L84 6 L106 24Z" fill="#ffd166" ${ST3}/><path d="M152 34 L160 6 L138 24Z" fill="#ffd166" ${ST3}/>
<circle cx="122" cy="66" r="44" fill="${body}" ${ST}/>
<ellipse cx="122" cy="86" rx="22" ry="14" fill="#fff3c4" ${ST3}/><circle cx="114" cy="84" r="3" fill="${INK}"/><circle cx="130" cy="84" r="3" fill="${INK}"/>`;
  if (happy) {
    b += `<path d="M98 62 Q108 52 118 62 M126 62 Q136 52 146 62" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
<ellipse cx="94" cy="76" rx="8" ry="4" fill="#ff7aa2" opacity=".6"/><ellipse cx="150" cy="76" rx="8" ry="4" fill="#ff7aa2" opacity=".6"/>
<polygon points="${starPts(30, 30, 12, 5)}" fill="#ffd166"/><polygon points="${starPts(216, 24, 10, 4)}" fill="#ff8fab"/>`;
  } else {
    b += `<path d="M96 48 L116 58 M148 48 L128 58" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
<circle cx="108" cy="66" r="9" fill="#fff"/><circle cx="136" cy="66" r="9" fill="#fff"/>
<circle cx="110" cy="68" r="5" fill="${INK}"/><circle cx="134" cy="68" r="5" fill="${INK}"/>
<path d="M214 20 L200 46 L212 46 L198 72" stroke="#ffd166" stroke-width="6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M40 130 L28 150 L38 150 L26 168" stroke="#ffd166" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  return svg(336, 238, 244, 172, b);
}

// ---------- Hành trình: rương báu, trạm nghỉ, cổng thử thách ----------

const chest = (open) => item(open
  ? `<ellipse cx="60" cy="52" rx="44" ry="26" fill="#fff3a8" opacity=".9"/>
<path d="M16 54 L28 14 L104 14 L106 54Z" fill="#d9a074" ${ST}/><path d="M22 52 L32 20 L98 20 L100 52Z" fill="#8a5a3c"/>
<circle cx="44" cy="50" r="8" fill="#ff6f9c" ${ST3}/><circle cx="62" cy="44" r="9" fill="#6cc4ff" ${ST3}/><polygon points="${starPts(80, 48, 11, 5)}" fill="#ffd166" ${ST3}/>
<rect x="14" y="54" width="92" height="54" rx="8" fill="#c08552" ${ST}/><rect x="14" y="54" width="92" height="10" fill="#ffd166" ${ST3}/>
<rect x="54" y="54" width="12" height="54" fill="#ffd166" ${ST3}/>`
  : `<rect x="14" y="52" width="92" height="56" rx="8" fill="#c08552" ${ST}/>
<path d="M14 58 Q14 22 60 22 Q106 22 106 58Z" fill="#d9a074" ${ST}/>
<rect x="14" y="52" width="92" height="10" fill="#ffd166" ${ST3}/><rect x="54" y="22" width="12" height="86" fill="#ffd166" ${ST3}/>
<rect x="49" y="58" width="22" height="20" rx="5" fill="#ffd166" ${ST3}/><circle cx="60" cy="66" r="3" fill="${INK}"/>
<polygon points="${starPts(18, 18, 8, 3)}" fill="#ffd166"/><polygon points="${starPts(104, 14, 6, 2.5)}" fill="#ffd166"/>`);

const rainbow = () => item(`<path d="M14 92 A46 46 0 0 1 106 92" stroke="#ff6b6b" stroke-width="10" fill="none"/>
<path d="M24 92 A36 36 0 0 1 96 92" stroke="#ffd166" stroke-width="10" fill="none"/>
<path d="M34 92 A26 26 0 0 1 86 92" stroke="#5fd3a8" stroke-width="10" fill="none"/>
<path d="M44 92 A16 16 0 0 1 76 92" stroke="#6cc4ff" stroke-width="10" fill="none"/>
<ellipse cx="18" cy="96" rx="18" ry="11" fill="#fff" ${ST3}/><ellipse cx="102" cy="96" rx="18" ry="11" fill="#fff" ${ST3}/>`);

// Cổng thử thách (mini-boss giữa đảo): đóng khi chưa qua, mở khi bé thắng.
function gateSVG(open) {
  let b = `<rect x="22" y="40" width="40" height="128" rx="8" fill="#c9c2cc" ${ST}/><rect x="182" y="40" width="40" height="128" rx="8" fill="#c9c2cc" ${ST}/>`;
  if (open) {
    b += `<rect x="62" y="64" width="120" height="104" fill="#fff3a8"/>
<path d="M62 64 L80 72 L80 160 L62 168Z" fill="#c08552" ${ST3}/><path d="M182 64 L164 72 L164 160 L182 168Z" fill="#c08552" ${ST3}/>
<polygon points="${starPts(122, 116, 22, 10)}" fill="#ffd166" ${ST3}/>
<path d="M30 70 Q42 60 54 70 M190 70 Q202 60 214 70" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M34 86 Q42 96 50 86 M194 86 Q202 96 210 86" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  } else {
    b += `<rect x="62" y="64" width="60" height="104" fill="#c08552" ${ST}/><rect x="122" y="64" width="60" height="104" fill="#c08552" ${ST}/>
<path d="M82 66 V166 M102 66 V166 M142 66 V166 M162 66 V166" stroke="#a86b45" stroke-width="3"/>
<path d="M80 92 L100 100 M164 92 L144 100" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
<circle cx="92" cy="108" r="6" fill="${INK}"/><circle cx="152" cy="108" r="6" fill="${INK}"/>
<path d="M66 132 L178 132" stroke="#8a7f93" stroke-width="7" stroke-dasharray="10 6"/>
<path d="M114 124 V116 a8 8 0 0 1 16 0 V124" stroke="#8a7f93" stroke-width="5" fill="none"/>
<rect x="108" y="122" width="28" height="24" rx="6" fill="#ffd166" ${ST3}/>`;
  }
  b += `<path d="M30 48 Q122 -14 214 48 L214 72 Q122 12 30 72Z" fill="#b7aec0" ${ST}/>
<circle cx="76" cy="40" r="7" fill="#ff8fab"/><circle cx="122" cy="24" r="7" fill="#ffd166"/><circle cx="168" cy="40" r="7" fill="#5fd3a8"/>`;
  return svg(336, 238, 244, 172, b);
}

const robot = () => item(`<path d="M60 10 L60 26" stroke="${INK}" stroke-width="4"/><circle cx="60" cy="10" r="6" fill="#ff6b6b" ${ST3}/>
<path d="M34 84 L18 96 M86 84 L102 96" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
<rect x="38" y="104" width="16" height="10" rx="3" fill="${INK}"/><rect x="66" y="104" width="16" height="10" rx="3" fill="${INK}"/>
<rect x="34" y="74" width="52" height="34" rx="10" fill="#6cc4ff" ${ST}/><circle cx="60" cy="91" r="6" fill="#ff8fab"/>
<rect x="18" y="38" width="12" height="20" rx="5" fill="#ffd166" ${ST3}/><rect x="90" y="38" width="12" height="20" rx="5" fill="#ffd166" ${ST3}/>
<rect x="28" y="24" width="64" height="50" rx="16" fill="#a0d8ff" ${ST}/><rect x="36" y="32" width="48" height="34" rx="10" fill="#fff"/>
${face(60, 47, 0.85)}`);

// Boss Đảo 2: Quái Gió Xoáy.
function boss2SVG(happy) {
  const fill = happy ? '#cfeeff' : '#8c86b8';
  const edge = happy ? '#9cc9e8' : INK;
  const layers = [[124, 156, 26, 12], [116, 132, 46, 16], [124, 104, 66, 19], [118, 74, 86, 23], [122, 40, 104, 28]];
  let b = layers.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${edge}" stroke-width="5"/>`).join('');
  b += `<path d="M60 50 Q90 60 130 46 M70 82 Q100 90 150 76 M90 112 Q112 118 150 106" stroke="${happy ? '#ffffff' : '#a9a3d4'}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  if (happy) {
    b += `<path d="M90 70 Q100 60 110 70 M134 70 Q144 60 154 70" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M108 86 Q122 102 136 86Z" fill="#ff7aa2" ${ST3}/>
<ellipse cx="88" cy="88" rx="9" ry="5" fill="#ff9fbf" opacity=".7"/><ellipse cx="156" cy="88" rx="9" ry="5" fill="#ff9fbf" opacity=".7"/>
<polygon points="${starPts(30, 40, 12, 5)}" fill="#ffd166"/><polygon points="${starPts(210, 70, 10, 4)}" fill="#ffd166"/><polygon points="${starPts(200, 140, 8, 3)}" fill="#ff8fab"/>`;
  } else {
    b += `<path d="M86 58 L108 68 M158 58 L136 68" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
<circle cx="100" cy="78" r="10" fill="#fff"/><circle cx="144" cy="78" r="10" fill="#fff"/>
<circle cx="102" cy="80" r="5" fill="${INK}"/><circle cx="142" cy="80" r="5" fill="${INK}"/>
<path d="M110 102 Q122 92 134 102" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M18 64 q10 -12 22 0 q-12 10 -22 0Z M206 40 q10 -12 22 0 q-12 10 -22 0Z M196 130 q8 -10 18 0 q-10 8 -18 0Z" fill="#7ed957" ${ST3}/>
<path d="M34 120 l10 -6 M214 96 l12 4" stroke="#a9a3d4" stroke-width="5" stroke-linecap="round"/>`;
  }
  return svg(336, 238, 244, 172, b);
}

function bgSea() {
  const defs = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#eef9ff"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fdcf7"/><stop offset="1" stop-color="#4fb5e6"/></linearGradient>`;
  let b = `<rect width="1280" height="200" fill="url(#sky)"/><rect y="200" width="1280" height="520" fill="url(#sea)"/>
<circle cx="140" cy="120" r="52" fill="#ffe27a" opacity=".9"/>`;
  const r = rng(11);
  for (let i = 0; i < 26; i++) {
    const x = r() * 1240, y = 230 + r() * 470;
    b += `<path d="M${f1(x)} ${f1(y)} q14 -8 28 0 t28 0" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>`;
  }
  return svg(1280, 720, 1280, 720, b, defs);
}

// Chú cún cười lăn lộn, xuất hiện khi bé trả lời sai.
const dogLaugh = () => svg(200, 200, 120, 120, `<path d="M98 86 Q116 78 112 64" stroke="#a86b45" stroke-width="8" fill="none" stroke-linecap="round"/>
<ellipse cx="22" cy="42" rx="12" ry="22" fill="#a86b45" ${ST} transform="rotate(-30 22 42)"/>
<ellipse cx="98" cy="42" rx="12" ry="22" fill="#a86b45" ${ST} transform="rotate(30 98 42)"/>
<ellipse cx="60" cy="80" rx="38" ry="30" fill="#e8c39e" ${ST}/>
<ellipse cx="40" cy="106" rx="12" ry="8" fill="#e8c39e" ${ST3}/><ellipse cx="80" cy="106" rx="12" ry="8" fill="#e8c39e" ${ST3}/>
<circle cx="60" cy="48" r="34" fill="#e8c39e" ${ST}/>
<ellipse cx="78" cy="36" rx="11" ry="10" fill="#c99a6e"/>
<path d="M36 36 L47 43 L36 50 M84 36 L73 43 L84 50" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M30 52 q-6 10 0 13 q6 -3 0 -13Z M90 52 q-6 10 0 13 q6 -3 0 -13Z" fill="#8ec5ff"/>
<ellipse cx="60" cy="52" rx="6" ry="4" fill="${INK}"/>
<path d="M42 58 Q60 88 78 58Z" fill="#e8566f" ${ST3}/>
<path d="M51 72 Q60 82 69 72 Q60 67 51 72Z" fill="#ff9fbf"/>
<ellipse cx="34" cy="60" rx="6" ry="3.5" fill="#ff7aa2" opacity=".6"/><ellipse cx="86" cy="60" rx="6" ry="3.5" fill="#ff7aa2" opacity=".6"/>
<ellipse cx="22" cy="84" rx="10" ry="9" fill="#e8c39e" ${ST3}/><ellipse cx="98" cy="84" rx="10" ry="9" fill="#e8c39e" ${ST3}/>`);

// ---------- Nhân vật ----------

const owl = () => svg(180, 180, 120, 120, `<path d="M22 32 L24 6 L44 24Z" fill="#9b7ee0" ${ST}/><path d="M98 32 L96 6 L76 24Z" fill="#9b7ee0" ${ST}/>
<ellipse cx="18" cy="72" rx="12" ry="24" fill="#9b7ee0" ${ST} transform="rotate(15 18 72)"/>
<ellipse cx="102" cy="72" rx="12" ry="24" fill="#9b7ee0" ${ST} transform="rotate(-15 102 72)"/>
<path d="M46 110 l-5 8 M46 110 l0 9 M46 110 l5 8 M74 110 l-5 8 M74 110 l0 9 M74 110 l5 8" stroke="#ffb347" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="60" cy="66" rx="44" ry="47" fill="#b89cf0" ${ST}/>
<ellipse cx="60" cy="86" rx="26" ry="23" fill="#f3e8ff"/>
<path d="M50 80 q5 5 10 0 q5 5 10 0 M46 92 q5 5 10 0 q5 5 10 0 q5 5 10 0" stroke="#d9c6fb" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="42" cy="54" r="16" fill="#fff" ${ST3}/><circle cx="78" cy="54" r="16" fill="#fff" ${ST3}/>
<circle cx="44" cy="56" r="9" fill="${INK}"/><circle cx="76" cy="56" r="9" fill="${INK}"/>
<circle cx="47" cy="52" r="3.4" fill="#fff"/><circle cx="79" cy="52" r="3.4" fill="#fff"/>
<path d="M54 66 L66 66 L60 76Z" fill="#ffb347" ${ST3}/>
<ellipse cx="28" cy="72" rx="6" ry="3.5" fill="#ff7aa2" opacity=".6"/><ellipse cx="92" cy="72" rx="6" ry="3.5" fill="#ff7aa2" opacity=".6"/>
<path d="M60 20 Q68 4 82 8 Q74 22 60 20Z" fill="#5cc98a" ${ST3}/>`);

function bossSVG(happy) {
  const fill = happy ? '#ffffff' : '#6d7191';
  const edge = happy ? '#c9d6ee' : INK;
  const blobs = [[70, 92, 50], [122, 70, 60], [176, 94, 48]];
  const outline = blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${edge}" stroke-width="5"/>`).join('')
    + `<rect x="34" y="92" width="176" height="52" rx="26" fill="${fill}" stroke="${edge}" stroke-width="5"/>`;
  const inner = blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 2.5}" fill="${fill}"/>`).join('')
    + `<rect x="36.5" y="94.5" width="171" height="47" rx="23.5" fill="${fill}"/>`;
  let faceSvg;
  if (happy) {
    faceSvg = `<path d="M86 96 Q98 82 110 96 M134 96 Q146 82 158 96" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M106 112 Q122 132 138 112Z" fill="#ff7aa2" ${ST3}/>
<ellipse cx="78" cy="112" rx="11" ry="6" fill="#ff9fbf" opacity=".7"/><ellipse cx="166" cy="112" rx="11" ry="6" fill="#ff9fbf" opacity=".7"/>
<path d="M40 30 Q122 -30 204 30" stroke="#ff8fab" stroke-width="7" fill="none" opacity=".8"/>
<path d="M48 36 Q122 -18 196 36" stroke="#ffd166" stroke-width="7" fill="none" opacity=".8"/>
<path d="M56 42 Q122 -6 188 42" stroke="#8ee3c8" stroke-width="7" fill="none" opacity=".8"/>`;
  } else {
    faceSvg = `<path d="M82 76 L108 88 M162 76 L136 88" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
<circle cx="98" cy="100" r="11" fill="#fff"/><circle cx="146" cy="100" r="11" fill="#fff"/>
<circle cx="100" cy="102" r="6" fill="${INK}"/><circle cx="144" cy="102" r="6" fill="${INK}"/>
<path d="M108 128 Q122 116 136 128" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M70 150 q-7 11 0 15 q7 -4 0 -15Z M122 152 q-7 11 0 15 q7 -4 0 -15Z M172 150 q-7 11 0 15 q7 -4 0 -15Z" fill="#8ec5ff"/>
<path d="M150 146 L140 160 L150 160 L142 170" stroke="#ffd166" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  return svg(336, 238, 244, 172, outline + inner + faceSvg);
}

export const DEFAULT_PLAYER = { gender: 'girl', skin: '#ffe0c7', hair: '#6b4226', outfit: '#ff8fab', acc: 'bow' };

export function chibiSVG(o = DEFAULT_PLAYER, mood = 'normal') {
  const { gender, skin, hair, outfit, acc } = { ...DEFAULT_PLAYER, ...o };
  const hairDark = darkHex(hair, 0.75);
  const outfitDark = darkHex(outfit, 0.85);
  let b = `<ellipse cx="100" cy="251" rx="54" ry="7" fill="#000" opacity=".12"/>`;
  // Đôi cánh nằm sau lưng nên vẽ trước thân.
  if (acc === 'wings') {
    const wingPath = 'M74 186 Q24 140 8 176 Q18 196 38 194 Q14 210 28 226 Q58 222 76 200Z';
    b += `<path d="${wingPath}" fill="#fff" ${ST3}/><path d="${wingPath}" fill="#fff" ${ST3} transform="translate(200 0) scale(-1 1)"/>
<path d="M58 182 Q36 170 22 178 M58 196 Q40 198 30 210" stroke="#c9dcf2" stroke-width="3" fill="none"/>
<path d="M142 182 Q164 170 178 178 M142 196 Q160 198 170 210" stroke="#c9dcf2" stroke-width="3" fill="none"/>`;
  }
  if (gender === 'girl') {
    b += `<ellipse cx="30" cy="132" rx="20" ry="32" fill="${hair}" ${ST3} transform="rotate(18 30 132)"/>
<ellipse cx="170" cy="132" rx="20" ry="32" fill="${hair}" ${ST3} transform="rotate(-18 170 132)"/>
<circle cx="38" cy="104" r="8" fill="#ff7aa2" ${ST3}/><circle cx="162" cy="104" r="8" fill="#ff7aa2" ${ST3}/>`;
  }
  b += `<rect x="80" y="210" width="16" height="34" rx="8" fill="${skin}" ${ST3}/><rect x="104" y="210" width="16" height="34" rx="8" fill="${skin}" ${ST3}/>
<ellipse cx="86" cy="245" rx="14" ry="8" fill="#7a5263" ${ST3}/><ellipse cx="114" cy="245" rx="14" ry="8" fill="#7a5263" ${ST3}/>
<ellipse cx="62" cy="194" rx="11" ry="22" fill="${outfitDark}" ${ST3} transform="rotate(28 62 194)"/>
<ellipse cx="138" cy="194" rx="11" ry="22" fill="${outfitDark}" ${ST3} transform="rotate(-28 138 194)"/>
<circle cx="53" cy="212" r="9" fill="${skin}" ${ST3}/><circle cx="147" cy="212" r="9" fill="${skin}" ${ST3}/>`;
  if (gender === 'girl') {
    b += `<path d="M66 170 Q100 160 134 170 L150 226 Q100 236 50 226Z" fill="${outfit}" ${ST3}/>
<path d="M56 218 Q100 228 144 218" stroke="#fff" stroke-width="4" fill="none" opacity=".8" stroke-linecap="round"/>
<circle cx="84" cy="200" r="4" fill="#fff" opacity=".7"/><circle cx="116" cy="200" r="4" fill="#fff" opacity=".7"/><circle cx="100" cy="212" r="4" fill="#fff" opacity=".7"/>`;
  } else {
    b += `<path d="M70 204 L130 204 L132 226 L104 226 L100 216 L96 226 L68 226Z" fill="#5b8def" ${ST3}/>
<path d="M66 172 Q100 162 134 172 L136 210 Q100 216 64 210Z" fill="${outfit}" ${ST3}/>
<polygon points="${starPts(100, 192, 9, 4)}" fill="#fff" opacity=".9"/>`;
  }
  b += `<path d="M86 167 L100 180 L114 167Z" fill="#fff" ${ST3}/>
<circle cx="30" cy="114" r="12" fill="${skin}" ${ST3}/><circle cx="170" cy="114" r="12" fill="${skin}" ${ST3}/>
<circle cx="100" cy="100" r="72" fill="${skin}" ${ST3}/>
<path d="M26 104 C20 44 58 18 100 18 C142 18 180 44 174 104 C164 84 154 74 144 64 C132 80 114 76 104 62 C92 78 72 80 62 66 C50 78 38 88 26 104Z" fill="${hair}" ${ST3}/>
<path d="M58 38 Q76 27 96 27" stroke="#fff" stroke-width="5" opacity=".4" fill="none" stroke-linecap="round"/>`;
  if (gender === 'boy') b += `<path d="M100 20 Q104 0 124 4 Q108 8 108 22Z" fill="${hair}" ${ST3}/>`;

  b += `<path d="M58 94 Q68 89 78 93 M122 93 Q132 89 142 94" stroke="${hairDark}" stroke-width="4" fill="none" stroke-linecap="round"/>
<ellipse cx="52" cy="142" rx="12" ry="7" fill="#ff8fab" opacity=".55"/><ellipse cx="148" cy="142" rx="12" ry="7" fill="#ff8fab" opacity=".55"/>`;
  if (mood === 'happy') {
    b += `<path d="M57 122 Q70 106 83 122 M117 122 Q130 106 143 122" stroke="#3b2a3f" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M88 140 Q100 162 112 140Z" fill="#e8566f" ${ST3}/>`;
  } else {
    for (const x of [70, 130]) {
      b += `<ellipse cx="${x}" cy="118" rx="13" ry="17" fill="#3b2a3f"/><ellipse cx="${x}" cy="125" rx="9" ry="8" fill="#8a63c9" opacity=".9"/>
<circle cx="${x + 5}" cy="111" r="5.5" fill="#fff"/><circle cx="${x - 4}" cy="127" r="2.6" fill="#fff"/>`;
    }
    b += `<path d="M92 146 Q100 154 108 146" stroke="#3b2a3f" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }

  if (acc === 'bow') {
    b += `<path d="M150 42 L128 28 L130 58Z" fill="#ff6f9c" ${ST3}/><path d="M150 42 L172 28 L170 58Z" fill="#ff6f9c" ${ST3}/><circle cx="150" cy="43" r="8" fill="#ff9fbf" ${ST3}/>`;
  } else if (acc === 'hat') {
    b += `<path d="M60 32 Q62 2 100 2 Q138 2 140 32Z" fill="#ffd166" ${ST3}/><path d="M62 26 L138 26" stroke="#ff7aa2" stroke-width="7"/>
<ellipse cx="100" cy="32" rx="72" ry="14" fill="#ffd166" ${ST3}/><circle cx="128" cy="18" r="7" fill="#ff8fab" ${ST3}/>`;
  } else if (acc === 'glasses') {
    b += `<circle cx="70" cy="118" r="22" fill="#fff" fill-opacity=".15" stroke="#5b3a5e" stroke-width="5"/><circle cx="130" cy="118" r="22" fill="#fff" fill-opacity=".15" stroke="#5b3a5e" stroke-width="5"/>
<path d="M92 116 Q100 109 108 116" stroke="#5b3a5e" stroke-width="5" fill="none"/>`;
  } else if (acc === 'crown') {
    b += `<path d="M64 36 L58 6 L80 20 L100 2 L120 20 L142 6 L136 36Z" fill="#ffd34d" ${ST3}/>
<circle cx="100" cy="24" r="5" fill="#ff6f9c"/><circle cx="78" cy="28" r="4" fill="#6cc4ff"/><circle cx="122" cy="28" r="4" fill="#5fd3a8"/>`;
  } else if (acc === 'flower') {
    // Hoa hướng dương cài tóc (phần thưởng rương Đảo 2)
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5, x = f1(150 + Math.cos(a) * 15), y = f1(42 + Math.sin(a) * 15);
      b += `<ellipse cx="${x}" cy="${y}" rx="8" ry="5" fill="#ffd23f" ${ST3} transform="rotate(${i * 36} ${x} ${y})"/>`;
    }
    b += `<circle cx="150" cy="42" r="10" fill="#a0683f" ${ST3}/>`;
  } else if (acc === 'shell') {
    b += `<path d="M150 58 L132 38 Q150 18 168 38Z" fill="#ffb3c8" ${ST3}/>
<path d="M150 58 L140 32 M150 58 L150 26 M150 58 L160 32" stroke="#ff8fab" stroke-width="2.5"/>`;
  } else if (acc === 'star') {
    b += `<polygon points="${starPts(150, 42, 17, 8)}" fill="#ffd166" ${ST3}/><circle cx="146" cy="38" r="3" fill="#fff" opacity=".8"/>`;
  } else if (acc === 'mushroom') {
    b += `<path d="M44 44 Q50 -4 100 -2 Q150 -4 156 44 Q100 30 44 44Z" fill="#ff6b6b" ${ST3}/>
<circle cx="72" cy="20" r="7" fill="#fff"/><circle cx="104" cy="10" r="6" fill="#fff"/><circle cx="132" cy="24" r="8" fill="#fff"/><circle cx="96" cy="32" r="4" fill="#fff"/>`;
  } else if (acc === 'leaf') {
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * (1.12 + i * 0.095), x = f1(100 + Math.cos(a) * 74), y = f1(100 + Math.sin(a) * 74);
      b += `<ellipse cx="${x}" cy="${y}" rx="12" ry="6" fill="${i % 2 ? '#5cc98a' : '#7ed957'}" ${ST3} transform="rotate(${f1((a * 180) / Math.PI + 90)} ${x} ${y})"/>`;
    }
    b += `<circle cx="100" cy="26" r="6" fill="#ff8fab" ${ST3}/>`;
  } else if (acc === 'halo') {
    b += `<ellipse cx="100" cy="10" rx="44" ry="9" fill="none" stroke="#fff3a8" stroke-width="12" opacity=".7"/>
<ellipse cx="100" cy="10" rx="44" ry="9" fill="none" stroke="#ffd166" stroke-width="6"/>`;
  }
  return svg(300, 390, 200, 260, b);
}

// ---------- Giao diện ----------

const star = (fill, edge) => svg(96, 96, 100, 100, `<polygon points="${starPts(50, 53, 46, 21)}" fill="${fill}" stroke="${edge}" stroke-width="6" stroke-linejoin="round"/>
${fill === '#ffd166' ? '<ellipse cx="38" cy="40" rx="6" ry="9" fill="#fff" opacity=".55" transform="rotate(30 38 40)"/>' : ''}`);

const sparkle = () => svg(40, 40, 40, 40, `<path d="M20 0 Q23 17 40 20 Q23 23 20 40 Q17 23 0 20 Q17 17 20 0Z" fill="#fff"/>`);

const lock = () => svg(80, 80, 80, 80, `<path d="M24 38 V26 a16 16 0 0 1 32 0 V38" stroke="#8a7f93" stroke-width="8" fill="none"/>
<rect x="12" y="34" width="56" height="40" rx="12" fill="#b7aec0" ${ST3}/><circle cx="40" cy="50" r="6" fill="${INK}"/><rect x="37" y="52" width="6" height="12" rx="3" fill="${INK}"/>`);

const icon = (body) => svg(64, 64, 64, 64, body);
const icHome = () => icon(`<path d="M8 32 L32 10 L56 32 H48 V54 H16 V32Z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><rect x="27" y="38" width="10" height="16" rx="3" fill="#000" opacity=".15"/>`);
const speaker = `<path d="M8 24 H20 L34 12 V52 L20 40 H8Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`;
const icSound = () => icon(`${speaker}<path d="M42 23 Q49 32 42 41" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M48 15 Q61 32 48 49" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`);
const icMute = () => icon(`${speaker}<path d="M42 24 L56 40 M56 24 L42 40" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`);
const musicNote = `<path d="M24 46 V16 L50 10 V40" stroke="#fff" stroke-width="5" fill="none" stroke-linejoin="round"/><ellipse cx="18" cy="47" rx="8" ry="6" fill="#fff"/><ellipse cx="44" cy="41" rx="8" ry="6" fill="#fff"/>`;
const icMusic = () => icon(musicNote);
const icMusicOff = () => icon(`<g opacity=".55">${musicNote}</g><path d="M10 10 L54 54" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`);
const icBook = () => icon(`<path d="M6 14 Q19 7 32 14 V54 Q19 47 6 54Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M58 14 Q45 7 32 14 V54 Q45 47 58 54Z" fill="#fff" opacity=".8"/><polygon points="${starPts(19, 30, 7, 3)}" fill="#ffc94d"/>`);

const noteArrow = (fill) => svg(120, 120, 100, 100, `<circle cx="50" cy="50" r="44" fill="${fill}" stroke="#fff" stroke-width="6"/>
<path d="M50 16 L80 48 L61 48 L61 82 L39 82 L39 48 L20 48Z" fill="#fff" ${ST3}/>`);

const cloud = () => {
  const blobs = '<circle cx="70" cy="75" r="40"/><circle cx="120" cy="56" r="48"/><circle cx="170" cy="78" r="38"/><rect x="40" y="70" width="160" height="45" rx="22"/>';
  return svg(240, 130, 240, 130, `<g fill="#fff" stroke="#e3ecf8" stroke-width="5">${blobs}</g><g fill="#fff">${blobs}</g>`);
};

function bigTree(lit) {
  const crown = lit ? '#6fd389' : '#9cc49a';
  const blobs = [[90, 132, 70], [210, 132, 70], [150, 92, 84], [150, 170, 68]];
  const outline = blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${crown}" ${ST}/>`).join('');
  const fill = blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 2.5}" fill="${crown}"/>`).join('');
  let extra = '';
  const spots = [[80, 110], [128, 60], [190, 96], [226, 150], [104, 170], [168, 150], [60, 160], [214, 70]];
  if (lit) {
    const cols = ['#ff6f9c', '#ffd166', '#6cc4ff', '#b48cf0', '#ff8a5c'];
    extra = spots.map(([x, y], i) => `<polygon points="${starPts(x, y, 15, 7)}" fill="${cols[i % cols.length]}" ${ST3}/>`).join('');
  } else {
    extra = spots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#c8d6c4" ${ST3}/>`).join('');
  }
  const glow = lit ? `<circle cx="150" cy="140" r="150" fill="url(#glow)"/>` : '';
  const defs = `<radialGradient id="glow"><stop offset="0" stop-color="#fff3a8" stop-opacity=".9"/><stop offset="1" stop-color="#fff3a8" stop-opacity="0"/></radialGradient>`;
  return svg(300, 320, 300, 320, `${glow}<path d="M126 196 Q122 270 100 312 L200 312 Q178 270 174 196Z" fill="#b07b52" ${ST}/>
${outline}${fill}${extra}${face(150, 262, 1.2)}`, defs);
}

// ---------- Nền ----------

function sunflowerDeco(x, y, s = 1) {
  let petals = '';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    petals += `<ellipse cx="${f1(Math.cos(a) * 20)}" cy="${f1(Math.sin(a) * 20)}" rx="11" ry="6" fill="#ffd23f" transform="rotate(${i * 30} ${f1(Math.cos(a) * 20)} ${f1(Math.sin(a) * 20)})"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 Q4 40 0 70" stroke="#4caf6e" stroke-width="7" fill="none"/>
<ellipse cx="-14" cy="48" rx="14" ry="7" fill="#5cc98a"/>${petals}<circle r="14" fill="#a0683f"/></g>`;
}

// theme: "berry" (Đảo Dâu Tây) hoặc "sunflower" (Đảo Hướng Dương).
const ISLAND_THEMES = {
  berry: { grass: '#a8e6a1', patch: '#98dd91' },
  sunflower: { grass: '#c8e98c', patch: '#b8de78' },
  coral: { grass: '#f6dcc8', patch: '#efcbb0' },
  mushroom: { grass: '#bfe3a8', patch: '#acd893' },
  sky: { grass: '#eaf4ff', patch: '#d8e9fb' },
};

const coralDeco = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
<path d="M0 40 L0 0 M0 18 L-18 -4 M-18 -4 L-22 -22 M0 10 L18 -10 M18 -10 L16 -28" stroke="${INK}" stroke-width="14" stroke-linecap="round" fill="none"/>
<path d="M0 40 L0 0 M0 18 L-18 -4 M-18 -4 L-22 -22 M0 10 L18 -10 M18 -10 L16 -28" stroke="#ff8fab" stroke-width="9" stroke-linecap="round" fill="none"/></g>`;
const mushroomDeco = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
<rect x="-10" y="0" width="20" height="30" rx="8" fill="#fff3e0" ${ST3}/><path d="M-30 4 Q-28 -30 0 -30 Q28 -30 30 4Z" fill="#ff6b6b" ${ST3}/>
<circle cx="-12" cy="-14" r="5" fill="#fff"/><circle cx="10" cy="-18" r="4" fill="#fff"/></g>`;
const cloudDeco = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" stroke="#c9dcf2" stroke-width="3">
<circle cx="-22" cy="4" r="18"/><circle cx="2" cy="-8" r="24"/><circle cx="26" cy="4" r="17"/><rect x="-36" y="2" width="76" height="20" rx="10"/></g>`;

function bgIsland(theme = 'berry') {
  const t = ISLAND_THEMES[theme] || ISLAND_THEMES.berry;
  const defs = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#fff0f7"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fdcf7"/><stop offset="1" stop-color="#5cc3ec"/></linearGradient>
<radialGradient id="sunglow"><stop offset="0" stop-color="#fff6c2"/><stop offset="1" stop-color="#fff6c2" stop-opacity="0"/></radialGradient>`;
  let b = `<rect width="1280" height="720" fill="url(#sky)"/>
<circle cx="1150" cy="130" r="130" fill="url(#sunglow)"/><circle cx="1150" cy="130" r="54" fill="#ffe27a"/>
<rect y="250" width="1280" height="470" fill="url(#sea)"/>`;
  for (const y of [272, 300, 330]) {
    let d = `M0 ${y}`;
    for (let x = 0; x < 1280; x += 80) d += ` q20 -8 40 0 t40 0`;
    b += `<path d="${d}" stroke="#fff" stroke-width="3" fill="none" opacity=".5"/>`;
  }
  b += `<path d="M30 720 C10 560 120 300 420 266 C700 236 1020 246 1190 326 C1310 396 1300 610 1250 720Z" fill="#f9e2b4"/>
<path d="M70 720 C50 580 160 326 430 296 C700 268 1000 278 1160 348 C1270 406 1262 600 1220 720Z" fill="${t.grass}"/>
<ellipse cx="300" cy="420" rx="140" ry="50" fill="${t.patch}" opacity=".7"/><ellipse cx="860" cy="660" rx="200" ry="50" fill="${t.patch}" opacity=".7"/>
<ellipse cx="1060" cy="430" rx="110" ry="40" fill="${t.patch}" opacity=".7"/>`;
  const bush = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="-24" cy="0" r="24" fill="#6fcf7a" ${ST3}/><circle cx="24" cy="0" r="24" fill="#6fcf7a" ${ST3}/><circle cx="0" cy="-14" r="28" fill="#6fcf7a" ${ST3}/>
<circle cx="-24" cy="0" r="22" fill="#6fcf7a"/><circle cx="24" cy="0" r="22" fill="#6fcf7a"/><circle cx="0" cy="-14" r="26" fill="#6fcf7a"/>
<path d="M-14 -10 c-6 -6 -12 0 -6 8 l6 6 l6 -6 c6 -8 0 -14 -6 -8z" fill="#ff5d7a"/><path d="M16 -2 c-6 -6 -12 0 -6 8 l6 6 l6 -6 c6 -8 0 -14 -6 -8z" fill="#ff5d7a"/><path d="M2 -28 c-6 -6 -12 0 -6 8 l6 6 l6 -6 c6 -8 0 -14 -6 -8z" fill="#ff5d7a"/></g>`;
  const deco = { sunflower: sunflowerDeco, coral: coralDeco, mushroom: mushroomDeco, sky: cloudDeco }[theme];
  if (deco) b += deco(110, 430) + deco(150, 470, 0.8) + deco(465, 410, 0.7) + deco(1215, 610, 0.7);
  else b += bush(110, 470) + bush(1215, 615, 0.7) + bush(440, 690, 0.7) + bush(500, 410, 0.7);
  const r = rng(7);
  const cols = ['#ff8fab', '#ffd166', '#ffffff', '#c8a8ff'];
  for (let i = 0; i < 60; i++) {
    const x = 140 + r() * 1020, y = 360 + r() * 340;
    b += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(3 + r() * 3)}" fill="${cols[i % cols.length]}" opacity=".9"/>`;
  }
  return svg(1280, 720, 1280, 720, b, defs);
}

function bgPlay() {
  const defs = `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2f8"/><stop offset="1" stop-color="#e8f5ff"/></linearGradient>`;
  let b = `<rect width="1280" height="720" fill="url(#g)"/>`;
  const r = rng(42);
  const cols = ['#ffffff', '#ffd6e3', '#d9ecff', '#fff1c7', '#e6dcff'];
  for (let i = 0; i < 46; i++) {
    b += `<circle cx="${f1(r() * 1280)}" cy="${f1(r() * 600)}" r="${f1(6 + r() * 14)}" fill="${cols[i % cols.length]}" opacity=".75"/>`;
  }
  b += `<path d="M0 640 Q200 592 420 630 T860 625 T1280 615 V720 H0Z" fill="#c9f0c4"/>
<path d="M0 684 Q300 644 640 676 T1280 666 V720 H0Z" fill="#b2e6ab"/>`;
  for (let i = 0; i < 24; i++) {
    const x = 20 + i * 54 + r() * 20, y = 650 + r() * 50;
    b += `<circle cx="${f1(x)}" cy="${f1(y)}" r="4" fill="${i % 2 ? '#ff8fab' : '#ffd166'}"/>`;
  }
  return svg(1280, 720, 1280, 720, b, defs);
}

function bgStage() {
  const defs = `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a4aa0"/><stop offset="1" stop-color="#c48bd6"/></linearGradient>`;
  let b = `<rect width="1280" height="720" fill="url(#g)"/>
<path d="M180 0 L320 0 L560 720 L0 720Z" fill="#fff" opacity=".07"/><path d="M960 0 L1100 0 L1280 720 L720 720Z" fill="#fff" opacity=".07"/>
<path d="M590 0 L690 0 L800 720 L480 720Z" fill="#fff" opacity=".05"/>`;
  const r = rng(99);
  for (let i = 0; i < 40; i++) {
    b += `<circle cx="${f1(r() * 1280)}" cy="${f1(r() * 520)}" r="${f1(1.5 + r() * 2.5)}" fill="#fff" opacity="${f1(0.4 + r() * 0.5)}"/>`;
  }
  b += `<ellipse cx="640" cy="740" rx="780" ry="150" fill="#43337a"/><ellipse cx="640" cy="742" rx="700" ry="120" fill="#4f3e8c"/>`;
  const bulbs = ['#ff8fab', '#ffd166', '#8ee3c8', '#a0d8ff', '#c8a8ff'];
  for (let i = 0; i < 22; i++) b += `<circle cx="${30 + i * 58}" cy="${14 + (i % 2) * 8}" r="8" fill="${bulbs[i % bulbs.length]}"/>`;
  return svg(1280, 720, 1280, 720, b, defs);
}

// Toàn bộ texture tĩnh của game: key -> chuỗi SVG.
export function buildArt() {
  const LANE_COLORS = ['#ff8fab', '#ffc94d', '#5fd3a8', '#6cc4ff'];
  const art = {
    strawberry: strawberry(), apple: apple(), banana: banana(), fish: fish(), chicken: chicken(), cow: cow(),
    cat: cat(), dog: dog(), flower: flower(), tree: tree(), house: house(), sun: sun(), moon: moon(),
    staritem: staritem(), heart: heart(), note: note(), basket: basket(),
    owl: owl(), boss: bossSVG(false), boss_happy: bossSVG(true),
    star: star('#ffd166', '#e89a1a'), star_empty: star('#ebe3ef', '#cfc3d6'), sparkle: sparkle(), lock: lock(),
    ic_home: icHome(), ic_sound: icSound(), ic_mute: icMute(), ic_book: icBook(),
    ic_music: icMusic(), ic_music_off: icMusicOff(), dog_laugh: dogLaugh(),
    cloud: cloud(), tree_big: bigTree(false), tree_big_lit: bigTree(true),
    bg_island: bgIsland(), bg_island2: bgIsland('sunflower'), bg_sea: bgSea(), bg_play: bgPlay(), bg_stage: bgStage(),
    pencil: pencil(), book: book(), bag: bag(), ball: ball(), car: car(), chair: chair(),
    bird: bird(), duck: duck(), pig: pig(), rabbit: rabbit(), sunflower: sunflower(), clock: clockIcon(),
    boss2: boss2SVG(false), boss2_happy: boss2SVG(true),
    cards: cards(), boxes: boxes(), scale: scaleIcon(), robot: robot(),
    chest: chest(false), chest_open: chest(true), rainbow: rainbow(), gate: gateSVG(false), gate_happy: gateSVG(true),
    turtle: turtle(), crab: crab(), frog: frog(), squirrel: squirrel(), bee: bee(), coral: coral(), shell: shell(), mushroom: mushroom(),
    boss3: boss3SVG(false), boss3_happy: boss3SVG(true), boss4: boss4SVG(false), boss4_happy: boss4SVG(true),
    boss5: boss5SVG(false), boss5_happy: boss5SVG(true),
    bg_island3: bgIsland('coral'), bg_island4: bgIsland('mushroom'), bg_island5: bgIsland('sky'),
  };
  LANE_COLORS.forEach((c, i) => { art[`note_${i}`] = noteArrow(c); });
  return art;
}

// ---------- Chibi theo lựa chọn của bé (tạo texture khi cần) ----------

const pending = new Map();

export function chibiKey(o, mood) {
  const p = { ...DEFAULT_PLAYER, ...o };
  return ['chibi', p.gender, p.skin, p.hair, p.outfit, p.acc, mood].join('_').replace(/#/g, '');
}

export function ensureChibi(textures, o, mood = 'normal') {
  const key = chibiKey(o, mood);
  if (textures.exists(key)) return Promise.resolve(key);
  if (pending.has(key)) return pending.get(key);
  const p = new Promise((resolve) => {
    const onAdd = (k) => {
      if (k !== key) return;
      textures.off('addtexture', onAdd);
      pending.delete(key);
      resolve(key);
    };
    textures.on('addtexture', onAdd);
    textures.addBase64(key, svgURI(chibiSVG(o, mood)));
  });
  pending.set(key, p);
  return p;
}

// Tạo ảnh chibi ngay lập tức; hình hiện ra khi texture sẵn sàng.
export function chibiImage(scene, x, y, o, mood = 'normal') {
  const img = scene.add.image(x, y, '__DEFAULT').setVisible(false);
  ensureChibi(scene.textures, o, mood).then((key) => {
    if (img.scene) img.setTexture(key).setVisible(true);
  });
  return img;
}
