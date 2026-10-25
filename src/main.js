import { W, H } from './config.js';
import Audio from './core/AudioManager.js';
import Save from './core/SaveManager.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import CharacterScene from './scenes/CharacterScene.js';
import WorldScene from './scenes/WorldScene.js';
import MapScene from './scenes/MapScene.js';
import JourneyScene from './scenes/JourneyScene.js';
import ResultScene from './scenes/ResultScene.js';
import ParentScene from './scenes/ParentScene.js';
import MathGame from './minigames/MathGame.js';
import WordGame from './minigames/WordGame.js';
import PatternGame from './minigames/PatternGame.js';
import MatchGame from './minigames/MatchGame.js';
import ColorGame from './minigames/ColorGame.js';
import DanceGame from './minigames/DanceGame.js';
import CatchGame from './minigames/CatchGame.js';
import BossGame from './minigames/BossGame.js';
import ClockGame from './minigames/ClockGame.js';
import MazeGame from './minigames/MazeGame.js';
import MemoryGame from './minigames/MemoryGame.js';
import SortGame from './minigames/SortGame.js';
import BalanceGame from './minigames/BalanceGame.js';
import CodeGame from './minigames/CodeGame.js';
import TangramGame from './minigames/TangramGame.js';
import SudokuGame from './minigames/SudokuGame.js';

Audio.init(Save.data.settings);

// Mỗi mini-game có key trùng với "type" trong file dữ liệu đảo (src/data/gradeN.json).
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#ffe5ec',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 3 },
  scene: [
    BootScene, MenuScene, CharacterScene, WorldScene, JourneyScene, MapScene, ResultScene, ParentScene,
    MathGame, WordGame, PatternGame, MatchGame, ColorGame, DanceGame, CatchGame, BossGame, ClockGame, MazeGame,
    MemoryGame, SortGame, BalanceGame, CodeGame, TangramGame, SudokuGame,
  ],
});

window.addEventListener('pointerdown', () => Audio.unlock());
// Safari trên iPhone chỉ cho mở âm thanh trong sự kiện touchend.
window.addEventListener('touchend', () => Audio.unlock());
window.__game = game;
