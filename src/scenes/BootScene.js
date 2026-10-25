import { W, H } from '../config.js';
import { buildArt, svgURI, ensureChibi } from '../art/svg.js';
import Save from '../core/SaveManager.js';
import { buildIsland } from '../core/Rewards.js';

// Mỗi đảo là một file trong src/data/, theo thứ tự trên bản đồ thế giới.
const ISLAND_FILES = ['grade1', 'grade2', 'grade3', 'grade4', 'grade5'];

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.add.text(W / 2, H / 2, 'Đang tải...', { fontFamily: 'sans-serif', fontSize: '40px', color: '#e8638c' }).setOrigin(0.5);
    ISLAND_FILES.forEach((id) => this.load.json(id, `src/data/${id}.json`));
  }

  create() {
    this.registry.set('islands', ISLAND_FILES.map((id) => buildIsland(this.cache.json.get(id))));
    const art = buildArt();
    const keys = new Set(Object.keys(art));
    const textures = new Promise((resolve) => {
      let left = keys.size;
      const tick = (key) => {
        if (!keys.has(key)) return;
        keys.delete(key);
        if (--left === 0) {
          this.textures.off('addtexture', tick);
          this.textures.off('onerror', onError);
          resolve();
        }
      };
      const onError = (key) => { console.warn('Không tạo được hình', key); tick(key); };
      this.textures.on('addtexture', tick);
      this.textures.on('onerror', onError);
      Object.entries(art).forEach(([k, s]) => this.textures.addBase64(k, svgURI(s)));
    });
    const fonts = document.fonts
      ? Promise.race([document.fonts.load('800 40px "Baloo 2"', 'Bé Chibi Đảo Trí Tuệ ấệ'), new Promise((r) => setTimeout(r, 3000))])
      : Promise.resolve();

    Promise.all([textures, fonts])
      .then(() => Promise.all([ensureChibi(this.textures, Save.player, 'normal'), ensureChibi(this.textures, Save.player, 'happy')]))
      .then(() => this.scene.start('Menu'));
  }
}
