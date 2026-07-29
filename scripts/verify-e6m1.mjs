/**
 * AUTO checks for E6.M1 scoring hooks.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';
import ScoringModule, {
  getScore,
  recordChallengeOutcome,
  finalizeShiftScore
} from '../game/assets/js/scoring.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

globalThis.document = {
  querySelector: () => ({ textContent: '', title: '' }),
  getElementById: () => null
};

assert(existsSync(join(root, 'game/assets/js/scoring.js')), 'scoring.js');
assert(GameConfig.scoring.startingTotal === 100, 'starting total');
const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
const gateSrc = readFileSync(join(root, 'game/assets/js/challenges/challenge-gate.js'), 'utf8');
const html = readFileSync(join(root, 'game/index.html'), 'utf8');
assert(appSrc.includes('ScoringModule'), 'app wires scoring');
assert(gateSrc.includes('recordChallengeOutcome'), 'challenge docks/awards');
assert(html.includes('id="shell-score"'), 'score chrome');

ScoringModule.init();
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
assert(getScore().total === 100, 'reset to 100');

const task = taskSystem.createTask({
  id: 'score-med',
  type: 'med',
  name: 'Score Med',
  scheduled: 1900,
  expire: '+30',
  durationMins: 5,
  patientId: 'joe'
});
taskSystem.processTasks(1900);
// seed snap at ACTIVE then complete
taskSystem.completeTask(task.id);
assert(getScore().total === 110, `complete +10 got ${getScore().total}`);
assert(getScore().taskPoints === 10, 'task dimension');

const late = taskSystem.createTask({
  id: 'score-late',
  type: 'med',
  name: 'Late Med',
  scheduled: 1900,
  expire: '+10',
  durationMins: 5,
  patientId: 'maria'
});
taskSystem.processTasks(1900);
taskSystem.processTasks(1915);
assert(getScore().total === 104, `overdue -6 got ${getScore().total}`);

recordChallengeOutcome({ passed: false, reason: 'incorrect', expected: 'lipitor' });
assert(getScore().total === 96, `challenge fail -8 got ${getScore().total}`);
assert(
  getScore().events.some((e) => /expected/.test(e.reason)),
  'fail cites expected'
);
recordChallengeOutcome({ passed: true, reason: 'correct' });
assert(getScore().total === 101, `challenge pass +5 got ${getScore().total}`);

gameState.dispatch('REGISTER_PATIENT', {
  patient: { id: 'joe', name: 'Joe', clinicalStatus: 'stable' }
});
gameState.dispatch('UPDATE_PATIENT', {
  patientId: 'joe',
  patch: { clinicalStatus: 'watch' }
});
gameState.dispatch('GAME_OVER');
const final = finalizeShiftScore();
assert(final.satisfactionPoints <= -3, 'satisfaction dock for watch');
assert(
  final.events.some((e) => e.dimension === 'satisfaction'),
  'satisfaction event logged'
);

if (failures.length) {
  console.error('E6.M1 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E6.M1 AUTO PASS');
