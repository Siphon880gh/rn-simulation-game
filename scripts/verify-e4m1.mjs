/**
 * AUTO checks for E4.M1 thin scenario pack loader.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import { normalizePack } from '../game/assets/js/scenario-pack.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const packPath = join(root, 'game/events/scenarios/night-shift-default.json');
assert(existsSync(packPath), 'default pack file');
const raw = JSON.parse(readFileSync(packPath, 'utf8'));
assert(raw.fictionalOnly === true, 'fictionalOnly');
assert(typeof raw.disclaimer === 'string' && raw.disclaimer.length > 0, 'pack disclaimer');
assert(Array.isArray(raw.learningObjectives) && raw.learningObjectives.length >= 2, 'learning objectives');
assert(Array.isArray(raw.patients) && raw.patients.length >= 4, 'patient census ids');

const pack = normalizePack(raw, 'events/scenarios/night-shift-default.json');
gameState.dispatch('SET_SCENARIO_PACK', { pack });
assert(gameState.getStateSlice('scenarioPack')?.id === 'night-shift-default', 'state stores pack');
assert(GameConfig.scenario.defaultPackUrl.includes('night-shift-default'), 'config default url');
assert(GameConfig.urlParams.scenarioPack === 'scenario', 'url param key');

const html = readFileSync(join(root, 'game/index.html'), 'utf8');
const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
const patientsSrc = readFileSync(join(root, 'game/assets/js/patients.js'), 'utf8');
assert(html.includes('id="scenario-pack-title"'), 'shell pack title mount');
assert(html.includes('id="fiction-disclaimer"'), 'shell disclaimer kept');
assert(appSrc.includes('ScenarioPackModule'), 'app wires scenario');
assert(appSrc.includes('await scenario.init()'), 'pack loads before patients');
assert(patientsSrc.includes('scenarioPack'), 'patients honor pack census');

if (failures.length) {
  console.error('E4.M1 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E4.M1 AUTO PASS');
