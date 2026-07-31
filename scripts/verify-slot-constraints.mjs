/**
 * AUTO checks for declarative queue-slot concurrency constraints.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';
import SlotSystem from '../game/assets/js/slot-system.js';
import {
  canEnterSlot,
  isExclusiveOccupancyActive,
  slotDisplayState,
  similarityKey
} from '../game/assets/js/slot-constraints.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/slot-constraints.js')), 'slot-constraints.js');
assert(GameConfig.slotConstraints?.enabled === true, 'config enabled');
assert(Array.isArray(GameConfig.slotConstraints.rules), 'rules array');
assert(
  GameConfig.slotConstraints.rules.some((r) => r.type === 'mutexSimilar' && r.match?.kind === 'shift-assessment'),
  'mutex shift-assessment rule'
);
assert(
  GameConfig.slotConstraints.rules.some((r) => r.type === 'requiresEmptySlots' && r.match?.kind === 'chart-assessment'),
  'exclusive chart rule'
);
assert(
  GameConfig.slotConstraints.rules.some((r) => r.type === 'blocksWith' && r.match?.kind === 'chart-assessment'),
  'chart blocksWith assessment rule'
);

const slotSrc = readFileSync(join(root, 'game/assets/js/slot-system.js'), 'utf8');
const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
const css = readFileSync(join(root, 'game/assets/css/declarative-tasks.css'), 'utf8');
assert(slotSrc.includes('canEnterSlot'), 'slot-system gates assign');
assert(slotSrc.includes('slotDisplayState'), 'slot-system renders disabled');
assert(appSrc.includes('canEnterSlot') || appSrc.includes('canAcceptTask'), 'app gates Perform');
assert(css.includes('task-slot--disabled'), 'disabled slot CSS');

gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });

const assessA = taskSystem.createTask({
  id: 'p1-shift-assessment',
  type: 'assessment',
  name: 'Shift assessment A',
  scheduled: 1900,
  expire: '+240',
  durationMins: 12,
  patientId: 'p1',
  metadata: { kind: 'shift-assessment' }
});
const assessB = taskSystem.createTask({
  id: 'p2-shift-assessment',
  type: 'assessment',
  name: 'Shift assessment B',
  scheduled: 1900,
  expire: '+240',
  durationMins: 12,
  patientId: 'p2',
  metadata: { kind: 'shift-assessment' }
});
const chartA = taskSystem.createTask({
  id: 'p1-chart-assessment',
  type: 'assessment',
  name: 'Chart assessment A',
  scheduled: 1900,
  expire: '+480',
  durationMins: 15,
  patientId: 'p1',
  metadata: { kind: 'chart-assessment' }
});
const med = taskSystem.createTask({
  id: 'p1-med',
  type: 'med',
  name: 'Med',
  scheduled: 1900,
  expire: '+60',
  durationMins: 10,
  patientId: 'p1'
});
taskSystem.processTasks(1900);

assert(similarityKey(assessA) === 'kind:shift-assessment', 'similarity key');
assert(canEnterSlot(assessA).ok === true, 'first assess ok');
assert(SlotSystem.requestSlot(assessA, 1900).ok === true, 'assign assess A');

const mutex = canEnterSlot(assessB);
assert(mutex.ok === false && mutex.reason === 'mutex-similar', `mutex got ${mutex.reason}`);
assert(SlotSystem.requestSlot(assessB, 1900).ok === false, 'second assess blocked');

const chartVsAssess = canEnterSlot(chartA);
assert(chartVsAssess.ok === false, 'chart blocked while assess in slot');
assert(
  chartVsAssess.reason === 'requires-empty-slots' || chartVsAssess.reason === 'blocks-with',
  `chart reason ${chartVsAssess.reason}`
);

SlotSystem.processSlots(1912);
assert(!SlotSystem.findSlotForTask(assessA.id), 'assess A finished');

assert(canEnterSlot(chartA).ok === true, 'chart ok when empty');
assert(SlotSystem.requestSlot(chartA, 1912).ok === true, 'assign chart');
assert(isExclusiveOccupancyActive() === true, 'exclusive active');
assert(slotDisplayState({ id: 1, taskId: null }) === 'disabled', 'empty slot disabled');

const medBlocked = canEnterSlot(med);
assert(medBlocked.ok === false && medBlocked.reason === 'exclusive-active', `exclusive got ${medBlocked.reason}`);
assert(SlotSystem.requestSlot(med, 1912).ok === false, 'med blocked during chart');

SlotSystem.processSlots(1927);
assert(isExclusiveOccupancyActive() === false, 'exclusive cleared');
assert(canEnterSlot(med).ok === true, 'med ok after chart');

// Chart needs empty: med occupies a slot
assert(SlotSystem.requestSlot(med, 1927).ok === true, 'assign med');
const chartNeedsEmpty = canEnterSlot({
  id: 'p2-chart-assessment',
  type: 'assessment',
  name: 'Chart B',
  metadata: { kind: 'chart-assessment' }
});
assert(chartNeedsEmpty.ok === false && chartNeedsEmpty.reason === 'requires-empty-slots', 'chart needs empty');

if (failures.length) {
  console.error('slot-constraints AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('slot-constraints AUTO PASS');
