/**
 * AUTO checks for E5.M3 bed-prep admission mini-game.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import {
  isBedPrepTask,
  gradeBedPrepOrder,
  getBedPrepSequence
} from '../game/assets/js/bed-prep-challenge.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/bed-prep-challenge.js')), 'bed-prep-challenge.js');
assert(GameConfig.tasks.types.BEDPREP, 'bedprep type');
assert(GameConfig.bedPrepChallenge.hintViews === 3, 'hint views');
const seq = getBedPrepSequence();
assert(seq.length === 7, 'CSBBBCL length');
assert(seq.map((s) => s.letter).join('') === 'CSBBBCL', 'mnemonic letters');

assert(isBedPrepTask({ type: 'bedprep', name: 'x' }), 'type detect');
assert(isBedPrepTask({ name: 'Bed prep for admission' }), 'name detect');
assert(!isBedPrepTask({ type: 'med', name: 'Aspirin' }), 'not med');

const labels = seq.map((s) => s.label);
const win = gradeBedPrepOrder(labels);
assert(win.passed === true, 'correct order passes');
const lose = gradeBedPrepOrder([...labels].reverse());
assert(lose.passed === false && lose.wrongIndexes.length > 0, 'wrong order fails');
assert(lose.expectedLabels.length === 7, 'cites expected labels');

const gateSrc = readFileSync(join(root, 'game/assets/js/challenge-gate.js'), 'utf8');
const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
const lin = readFileSync(join(root, 'game/events/patients/lin.html'), 'utf8');
assert(gateSrc.includes('bed-prep-challenge'), 'gate wires bed prep');
assert(gateSrc.includes('challengeGateCheat'), 'cheat on bed-prep modal');
assert(readFileSync(join(root, 'game/assets/js/bed-prep-challenge.js'), 'utf8').includes('bedPrepCheat'), 'bedPrepCheat');
assert(appSrc.includes('performBedPrepTask'), 'app complete-on-win path');
assert(lin.includes('data-task-type="bedprep"'), 'lin has bedprep task');

if (failures.length) {
  console.error('E5.M3 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E5.M3 AUTO PASS');
