/**
 * AUTO checks for E5.M3 bed-prep gather + IVPB hang sequence challenges.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import {
  isBedPrepTask,
  gradeBedPrepGather,
  getBedPrepRequired,
  buildBedPrepRound
} from '../game/assets/js/bed-prep-challenge.js';
import {
  isIvpbTask,
  gradeIvpbHangOrder,
  getIvpbHangSequence
} from '../game/assets/js/ivpb-hang-challenge.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/bed-prep-challenge.js')), 'bed-prep-challenge.js');
assert(existsSync(join(root, 'game/assets/js/ivpb-hang-challenge.js')), 'ivpb-hang-challenge.js');
assert(GameConfig.tasks.types.BEDPREP, 'bedprep type');
assert(GameConfig.bedPrepChallenge.hintViews === 3, 'hint views');
assert(Array.isArray(GameConfig.bedPrepChallenge.requiredItems), 'requiredItems config');
assert(Array.isArray(GameConfig.ivpbHangChallenge.sequence), 'ivpb sequence config');

const required = getBedPrepRequired();
assert(required.length === 7, 'required gather count');
assert(isBedPrepTask({ type: 'bedprep', name: 'x' }), 'type detect');
assert(isBedPrepTask({ name: 'Bed prep for admission' }), 'name detect');
assert(!isBedPrepTask({ type: 'med', name: 'Aspirin' }), 'not med');

const win = gradeBedPrepGather(required);
assert(win.passed === true, 'correct gather passes');
const loseOrder = gradeBedPrepGather([...required].reverse());
assert(loseOrder.passed === true, 'order does not matter for bed prep');
const loseExtra = gradeBedPrepGather([...required, 'Trash bag']);
assert(loseExtra.passed === false && loseExtra.extras.length > 0, 'extra distractor fails');
const loseMissing = gradeBedPrepGather(required.slice(0, 3));
assert(loseMissing.passed === false && loseMissing.missing.length > 0, 'missing items fail');

const round = buildBedPrepRound(() => 0.42);
assert(round.required.length === required.length, 'round keeps required');
assert(round.options.length > round.required.length, 'round mixes distractors');
assert(round.options.every((o) => typeof o === 'string'), 'option labels');

const bedSrc = readFileSync(join(root, 'game/assets/js/bed-prep-challenge.js'), 'utf8');
assert(bedSrc.includes('Gather these items'), 'gather copy');
assert(bedSrc.includes('bedPrepCheat'), 'bedPrepCheat');

const seq = getIvpbHangSequence();
assert(seq.length === 6, 'ivpb step count');
assert(isIvpbTask({ metadata: { challenge: 'ivpb' }, name: 'Ceftriaxone IVPB' }), 'ivpb challenge detect');
assert(isIvpbTask({ name: 'KCl IVPB' }), 'ivpb name detect');
assert(!isIvpbTask({ type: 'med', name: 'Aspirin' }), 'aspirin not ivpb');
const ivLabels = seq.map((s) => s.label);
assert(gradeIvpbHangOrder(ivLabels).passed === true, 'ivpb correct order passes');
assert(gradeIvpbHangOrder([...ivLabels].reverse()).passed === false, 'ivpb wrong order fails');
assert(ivLabels[0].toLowerCase().includes('spike'), 'starts with spike');
assert(ivLabels.some((l) => /backprime/i.test(l)), 'includes backprime');
assert(ivLabels.some((l) => /y site/i.test(l)), 'includes Y site');

const gateSrc = readFileSync(join(root, 'game/assets/js/challenge-gate.js'), 'utf8');
const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
const lin = readFileSync(join(root, 'game/events/patients/lin.html'), 'utf8');
const maria = readFileSync(join(root, 'game/events/patients/maria.html'), 'utf8');
assert(gateSrc.includes('bed-prep-challenge'), 'gate wires bed prep');
assert(gateSrc.includes('ivpb-hang-challenge'), 'gate wires ivpb hang');
assert(gateSrc.includes('Submit gather'), 'bed prep submit gather label');
assert(gateSrc.includes('challengeGateCheat'), 'cheat on challenge modal');
assert(appSrc.includes('performBedPrepTask'), 'app complete-on-win path');
assert(lin.includes('data-task-type="bedprep"'), 'lin has bedprep task');
assert(maria.includes('data-challenge="ivpb"'), 'maria has ivpb med');
assert(maria.includes('Ceftriaxone IVPB'), 'maria ivpb label');

if (failures.length) {
  console.error('E5.M3 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E5.M3 AUTO PASS');
