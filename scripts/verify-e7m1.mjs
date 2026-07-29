/**
 * AUTO checks for E7.M1 scene presence (CSS unit backdrop + still hooks).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/scene-backdrop.js')), 'scene-backdrop.js');
assert(existsSync(join(root, 'game/assets/css/scene.css')), 'scene.css');
assert(GameConfig.scene?.defaultTheme === 'medsurg', 'default theme');
assert(GameConfig.scene?.motion?.panelSwap === true, 'CSS motion flag');
assert(!GameConfig.scene?.gsap, 'no GSAP stamp');

const sceneSrc = readFileSync(join(root, 'game/assets/js/scene-backdrop.js'), 'utf8');
const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
const gateSrc = readFileSync(join(root, 'game/assets/js/challenges/challenge-gate.js'), 'utf8');
const indexSrc = readFileSync(join(root, 'game/index.html'), 'utf8');
const pack = JSON.parse(readFileSync(join(root, 'game/events/scenarios/night-shift-default.json'), 'utf8'));

assert(sceneSrc.includes('applyUnitScene'), 'applyUnitScene');
assert(appSrc.includes('SceneBackdropModule'), 'app wires scene');
assert(gateSrc.includes('applySituationStill'), 'challenge stills');
assert(indexSrc.includes('scene.css'), 'css linked');
assert(pack.scene?.theme === 'medsurg', 'pack scene theme');

if (failures.length) {
  console.error('E7.M1 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E7.M1 AUTO PASS');
