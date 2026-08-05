/**
 * AUTO checks for E8.M1 portfolio / demo packaging polish.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(GameConfig.demo && typeof GameConfig.demo.presets === 'object', 'demo.presets object');
assert(!GameConfig.demo.presets.quickNight, 'no quickNight preset');
assert(!GameConfig.demo.presets.quickDay, 'no quickDay preset');
assert(existsSync(join(root, 'game/events/scenarios/day-shift-medsurg.json')), 'day pack');

const readme = readFileSync(join(root, 'README.md'), 'utf8');
assert(/python3 -m http\.server/.test(readme), 'README run locally');
assert(/day-shift-medsurg/.test(readme), 'README day pack');

const index = readFileSync(join(root, 'game/index.html'), 'utf8');
assert(index.includes('id="shell-disclaimers"'), 'collapsed shell disclaimer');
assert(index.includes('id="shell-brand-title"'), 'brand title (unit picker)');
assert(!index.includes('demo-preset-links'), 'no demo-preset-links');
assert(!/Change unit/i.test(index), 'no Change unit link');
assert(!/quick night/i.test(index), 'no quick night link');
assert(!/quick day/i.test(index), 'no quick day link');

if (failures.length) {
  console.error('E8.M1 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E8.M1 AUTO PASS');
