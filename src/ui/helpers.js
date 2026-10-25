import { W, FONT, INK, C } from '../config.js';
import Audio from '../core/AudioManager.js';
import Save from '../core/SaveManager.js';

export const hex = (c) => '#' + c.toString(16).padStart(6, '0');

export function shade(color, f) {
  const r = Math.min(255, Math.round(((color >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((color >> 8) & 255) * f));
  const b = Math.min(255, Math.round((color & 255) * f));
  return (r << 16) | (g << 8) | b;
}

export function fit(img, size) {
  return img.setScale(size / Math.max(img.width, img.height));
}

export function text(scene, x, y, str, size = 32, color = INK, extra = {}) {
  return scene.add.text(x, y, str, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: '800',
    color,
    align: 'center',
    stroke: '#ffffff',
    strokeThickness: Math.max(2, Math.round(size / 7)),
    padding: { x: 6, y: Math.round(size * 0.18) },
    testString: '|ẤỆÉgjy',
    ...extra,
  }).setOrigin(0.5);
}

export function button(scene, x, y, w, h, label, color, onClick, opts = {}) {
  const c = scene.add.container(x, y);
  const dark = shade(color, 0.78);
  const r = opts.radius ?? Math.min(h / 2, 30);
  const g = scene.add.graphics();
  g.fillStyle(dark, 1).fillRoundedRect(-w / 2, -h / 2 + 7, w, h, r);
  g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2, w, h, r);
  g.fillStyle(0xffffff, 0.3).fillRoundedRect(-w / 2 + 12, -h / 2 + 6, w - 24, h * 0.32, Math.min(r * 0.6, h * 0.16));
  c.add(g);
  let tx = 0;
  if (opts.icon) {
    const ic = scene.add.image(label ? -w / 2 + h * 0.55 : 0, -2, opts.icon);
    fit(ic, opts.iconSize ?? h * 0.62);
    c.add(ic);
    c.icon = ic;
    if (label) tx = h * 0.28;
  }
  if (label) {
    c.label = text(scene, tx, -3, label, opts.size ?? Math.round(h * 0.4), '#ffffff', { stroke: hex(dark), strokeThickness: 6 });
    c.add(c.label);
  }
  c.setSize(w, h).setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => {
    if (c.disabled) return;
    scene.tweens.add({ targets: c, scaleX: 0.92, scaleY: 0.92, duration: 70, yoyo: true });
    Audio.click();
    if (onClick) onClick(c);
  });
  return c;
}

export function iconButton(scene, x, y, icon, color, onClick, size = 78) {
  return button(scene, x, y, size, size, '', color, onClick, { icon, radius: size / 2, iconSize: size * 0.58 });
}

// Thẻ lựa chọn trắng có viền màu, dùng cho trắc nghiệm.
export function choiceCard(scene, x, y, w, h, { label, image, color = C.sky, size, imageSize } = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  c.add(g);
  const draw = (fill, border) => {
    g.clear();
    g.fillStyle(shade(border, 0.8), 1).fillRoundedRect(-w / 2, -h / 2 + 7, w, h, 24);
    g.fillStyle(fill, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 24);
    g.lineStyle(6, border, 1).strokeRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 22);
  };
  draw(C.white, color);
  if (image) {
    const im = scene.add.image(0, 0, image);
    fit(im, imageSize ?? Math.min(w, h) * 0.75);
    c.add(im);
  }
  if (label !== undefined) c.add(text(scene, 0, -2, String(label), size ?? Math.round(h * 0.5), INK));
  c.setSize(w, h).setInteractive({ useHandCursor: true });
  c.mark = (state) => {
    c.setAlpha(1);
    if (state === 'right') draw(0xdcfbea, C.mint);
    else if (state === 'wrong') { draw(0xf3eff4, C.grey); c.setAlpha(0.55); }
    else if (state === 'selected') draw(0xfff3cf, C.yellow);
    else draw(C.white, color);
  };
  c.on('pointerdown', () => {
    if (c.disabled) return;
    scene.tweens.add({ targets: c, scaleX: 0.94, scaleY: 0.94, duration: 70, yoyo: true });
  });
  return c;
}

export function panel(scene, x, y, w, h, color = 0xffffff, alpha = 0.9, r = 32) {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x5b3a5e, 0.12).fillRoundedRect(-w / 2 + 6, -h / 2 + 10, w, h, r);
  g.fillStyle(color, alpha).fillRoundedRect(-w / 2, -h / 2, w, h, r);
  g.lineStyle(4, 0xffffff, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, r);
  return g;
}

export function starsRow(scene, x, y, n, size = 32) {
  const c = scene.add.container(x, y);
  const gap = size * 1.05;
  for (let i = 0; i < 3; i++) {
    const s = scene.add.image((i - 1) * gap, i === 1 ? -size * 0.15 : 0, i < n ? 'star' : 'star_empty');
    fit(s, size);
    c.add(s);
  }
  return c;
}

export function shake(scene, obj) {
  if (obj._shaking) return;
  obj._shaking = true;
  const x = obj.x;
  scene.tweens.add({ targets: obj, x: x + 12, duration: 50, yoyo: true, repeat: 3, onComplete: () => { obj.x = x; obj._shaking = false; } });
}

export function burst(scene, x, y, n = 18) {
  const p = scene.add.particles(x, y, 'sparkle', {
    speed: { min: 180, max: 420 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0 },
    rotate: { min: 0, max: 360 },
    lifespan: 800,
    gravityY: 500,
    tint: [0xffd166, 0xff8fab, 0x8ee3c8, 0xa0d8ff, 0xc8a8ff],
    emitting: false,
  }).setDepth(200);
  p.explode(n);
  scene.time.delayedCall(1200, () => p.destroy());
}

export function confetti(scene) {
  for (let i = 0; i < 6; i++) {
    scene.time.delayedCall(i * 140, () => burst(scene, Phaser.Math.Between(150, W - 150), Phaser.Math.Between(80, 260), 22));
  }
}

export function floatText(scene, x, y, str, color = '#ff5f93', size = 44) {
  const t = text(scene, x, y, str, size, color).setDepth(210);
  scene.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  return t;
}

export function driftClouds(scene, ys = [90, 170, 250]) {
  ys.forEach((y, i) => {
    const c = scene.add.image(Phaser.Math.Between(0, W), y, 'cloud').setScale(0.55 + i * 0.12).setAlpha(0.9);
    const drift = () => {
      scene.tweens.add({
        targets: c, x: W + 160, duration: (W + 160 - c.x) * (35 + i * 10),
        onComplete: () => { c.x = -160; drift(); },
      });
    };
    drift();
  });
}

export function enter(scene) {
  scene.cameras.main.fadeIn(260, 255, 240, 246);
}

export function go(scene, key, data) {
  if (scene._leaving) return;
  scene._leaving = true;
  scene.cameras.main.fadeOut(220, 255, 240, 246);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    scene._leaving = false;
    scene.scene.start(key, data);
  });
}

export function soundToggle(scene, x, y, size = 78) {
  const b = iconButton(scene, x, y, Audio.enabled ? 'ic_sound' : 'ic_mute', C.sky, () => {
    Audio.enabled = !Audio.enabled;
    Save.setSetting('sound', Audio.enabled);
    b.icon.setTexture(Audio.enabled ? 'ic_sound' : 'ic_mute');
  }, size);
  return b;
}

export function musicToggle(scene, x, y, size = 78) {
  const b = iconButton(scene, x, y, Audio.musicOn ? 'ic_music' : 'ic_music_off', C.purple, () => {
    Audio.setMusic(!Audio.musicOn);
    Save.setSetting('music', Audio.musicOn);
    b.icon.setTexture(Audio.musicOn ? 'ic_music' : 'ic_music_off');
  }, size);
  return b;
}

// Chú cún cười lăn lộn ngang màn hình (mỗi lần chỉ một chú).
export function laughingDog(scene) {
  if (scene._dogBusy) return;
  scene._dogBusy = true;
  const y = 610;
  const dur = 2400;
  const dog = scene.add.image(-110, y, 'dog_laugh').setScale(0.75).setDepth(150);
  scene.tweens.add({ targets: dog, x: W + 110, duration: dur, onComplete: () => { dog.destroy(); scene._dogBusy = false; } });
  scene.tweens.add({ targets: dog, angle: 1080, duration: dur });
  scene.tweens.add({ targets: dog, y: y - 40, duration: 200, yoyo: true, repeat: Math.floor(dur / 400) - 1, ease: 'Quad.easeOut' });
  [150, 1200].forEach((d) => scene.time.delayedCall(d, () => {
    if (!dog.scene) return;
    floatText(scene, dog.x, y - 110, 'Ha ha!', '#e8893f', 40);
    Audio.giggle();
  }));
}
