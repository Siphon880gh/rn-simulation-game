/**
 * AUTO checks for accucheck / sliding-scale insulin challenge + cheat fill.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isAccucheckTask,
  unitsForBloodSugar,
  buildAccucheckPrompt,
  checkAccucheckAnswer,
  normalizeAccucheckAnswer,
  INSULIN_TYPES,
  SLIDING_SCALE
} from '../game/assets/js/accucheck-challenge.js';
import {
  setShiftAnchor,
  isAtOrAfterInShift,
  getWindowPhase
} from '../game/assets/js/availability-windows.js';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/accucheck-challenge.js')), 'accucheck-challenge.js');
const gateSrc = readFileSync(join(root, 'game/assets/js/challenge-gate.js'), 'utf8');
assert(gateSrc.includes('accucheck-challenge'), 'gate imports accucheck');
assert(gateSrc.includes('challengeGateCheat'), 'cheat wired');
assert(gateSrc.includes('cheatChallenge'), 'unified cheatChallenge');
assert(gateSrc.includes('challengeModalFooter'), 'shared cheat footer');
assert(gateSrc.includes('submitAccucheck'), 'submitAccucheck path');

const aisha = readFileSync(join(root, 'game/events/patients/aisha.html'), 'utf8');
assert(aisha.includes('data-challenge="accucheck"'), 'aisha has accucheck challenge attr');
assert(aisha.includes('data-scheduled="2000"'), 'achs 2000');
assert(aisha.includes('data-scheduled="0600"'), 'achs 0600');

assert(isAccucheckTask({ metadata: { challenge: 'accucheck' } }), 'metadata challenge');
assert(isAccucheckTask({ name: 'Accucheck ACHS + sliding scale' }), 'name detect');
assert(!isAccucheckTask({ name: 'Aspirin' }), 'non-accucheck rejected');

assert(unitsForBloodSugar(65) === 0, 'hypo 0 units');
assert(unitsForBloodSugar(120) === 0, 'mid 0 units');
assert(unitsForBloodSugar(160) === 2, '150-179 → 2');
assert(unitsForBloodSugar(190) === 4, '180-200 → 4');
assert(SLIDING_SCALE.length >= 3, 'scale rows');
assert(INSULIN_TYPES.includes('regular') && INSULIN_TYPES.includes('aspart') && INSULIN_TYPES.includes('lispro'), 'insulin types');

const prompt = buildAccucheckPrompt(
  { name: 'Accucheck ACHS', metadata: { challenge: 'accucheck' } },
  { bloodSugar: 175, insulin: 'aspart', random: () => 0 }
);
assert(prompt.bloodSugar === 175, 'fixed BS');
assert(prompt.insulin === 'aspart', 'fixed insulin');
assert(prompt.expected === '2', 'expected units');
assert(checkAccucheckAnswer('2', prompt), 'answer 2');
assert(checkAccucheckAnswer('2 units', prompt), 'answer 2 units');
assert(checkAccucheckAnswer('2 U', prompt), 'answer 2 U');
assert(!checkAccucheckAnswer('4', prompt), 'wrong units rejected');
assert(normalizeAccucheckAnswer('  2 Units ') === '2', 'normalize');

// Random BS stays in 60–200
for (let i = 0; i < 40; i++) {
  const p = buildAccucheckPrompt(
    { name: 'Glucometer check', metadata: { challenge: 'accucheck' } },
    { random: () => (i + 0.5) / 40 }
  );
  assert(p.bloodSugar >= 60 && p.bloodSugar <= 200, `BS range ${p.bloodSugar}`);
  assert(INSULIN_TYPES.includes(p.insulin), `insulin ${p.insulin}`);
  assert(checkAccucheckAnswer(String(p.units), p), `self-check ${p.units}`);
}

const patientsSrc = readFileSync(join(root, 'game/assets/js/patients.js'), 'utf8');
assert(patientsSrc.includes('data-challenge'), 'patients extract challenge');

// ACHS 0600 must stay inactive during evening on night shift
setShiftAnchor(1900);
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
const morning = taskSystem.createTask({
  id: 'accucheck-0600',
  type: 'med',
  name: 'Accucheck ACHS + sliding scale',
  scheduled: 600,
  expire: 700,
  durationMins: 10,
  metadata: { challenge: 'accucheck' },
  patientId: 'aisha'
});
assert(!isAtOrAfterInShift(2000, 600), '2000 before 0600 in shift');
assert(isAtOrAfterInShift(600, 600), '0600 at scheduled');
assert(getWindowPhase(morning, 2000) === 'before', '0600 window before at 2000');
taskSystem.processTasks(2000);
assert(
  gameState.getStateSlice('tasks').get('accucheck-0600').status === GameConfig.tasks.statuses.NOT_YET,
  '0600 not activated at 2000'
);
taskSystem.processTasks(600);
assert(
  gameState.getStateSlice('tasks').get('accucheck-0600').status === GameConfig.tasks.statuses.ACTIVE,
  '0600 activates at 0600'
);

if (failures.length) {
  console.error('ACCUCHECK AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('ACCUCHECK AUTO PASS');
