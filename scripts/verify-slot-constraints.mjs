/**
 * AUTO checks for declarative queue-slot concurrency constraints.
 *
 * Shift and chart assessment both exclusive-lock the whole queue (require empty
 * slots to start; other tasks blocked while either runs). Mutex + blocksWith
 * still apply between the two assessment kinds.
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
  GameConfig.slotConstraints.rules.some(
    (r) => r.type === 'requiresEmptySlots' && r.exclusive === true && r.match?.kind === 'shift-assessment'
  ),
  'exclusive shift-assessment rule'
);
assert(
  GameConfig.slotConstraints.rules.some((r) => r.type === 'mutexSimilar' && r.match?.kind === 'chart-assessment'),
  'mutex chart-assessment rule'
);
assert(
  GameConfig.slotConstraints.rules.some(
    (r) => r.type === 'requiresEmptySlots' && r.exclusive === true && r.match?.kind === 'chart-assessment'
  ),
  'exclusive chart-assessment rule'
);
assert(
  GameConfig.slotConstraints.rules.some((r) => r.type === 'blocksWith' && r.match?.kind === 'chart-assessment' && r.blocksWhen?.kind === 'shift-assessment'),
  'chart blocksWith shift-assessment'
);
assert(
  GameConfig.slotConstraints.rules.some((r) => r.type === 'blocksWith' && r.match?.kind === 'shift-assessment' && r.blocksWhen?.kind === 'chart-assessment'),
  'shift blocksWith chart-assessment'
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
const chartB = taskSystem.createTask({
  id: 'p2-chart-assessment',
  type: 'assessment',
  name: 'Chart assessment B',
  scheduled: 1900,
  expire: '+480',
  durationMins: 15,
  patientId: 'p2',
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
assert(chartVsAssess.ok === false, `chart blocked during assess, got ${chartVsAssess.reason}`);
assert(
  chartVsAssess.reason === 'blocks-with'
    || chartVsAssess.reason === 'exclusive-active'
    || chartVsAssess.reason === 'requires-empty-slots',
  `chart reason ${chartVsAssess.reason}`
);

const medDuringAssess = canEnterSlot(med);
assert(medDuringAssess.ok === false && medDuringAssess.reason === 'exclusive-active', `med reason ${medDuringAssess.reason}`);
assert(String(medDuringAssess.message || '').toLowerCase().includes('shift assessment'), 'med block explains shift assessment');
assert(SlotSystem.requestSlot(med, 1900).ok === false, 'med blocked during assess');
assert(isExclusiveOccupancyActive() === true, 'exclusive during assess');
assert(slotDisplayState({ id: 2, taskId: null }) === 'disabled', 'empty slot disabled during assess');

SlotSystem.processSlots(1912);
assert(!SlotSystem.findSlotForTask(assessA.id), 'assess A finished');
assert(isExclusiveOccupancyActive() === false, 'exclusive cleared after assess');

assert(canEnterSlot(med).ok === true, 'med ok after assess done');
assert(SlotSystem.requestSlot(med, 1912).ok === true, 'assign med after assess');

const assessWhileMed = canEnterSlot(assessB);
assert(assessWhileMed.ok === false && assessWhileMed.reason === 'requires-empty-slots', `assess needs empty got ${assessWhileMed.reason}`);
assert(String(assessWhileMed.message || '').toLowerCase().includes('clear all queue slots'), 'assess block explains empty slots');

SlotSystem.processSlots(1922);
assert(!SlotSystem.findSlotForTask(med.id), 'med finished');

assert(canEnterSlot(chartA).ok === true, 'chart ok when slots empty');
assert(SlotSystem.requestSlot(chartA, 1922).ok === true, 'assign chart');
assert(isExclusiveOccupancyActive() === true, 'exclusive during chart');
assert(slotDisplayState({ id: 2, taskId: null }) === 'disabled', 'empty slot disabled during chart');

const chartMutex = canEnterSlot(chartB);
assert(chartMutex.ok === false && chartMutex.reason === 'mutex-similar', `chart mutex got ${chartMutex.reason}`);

const assessDuringChart = canEnterSlot(assessB);
assert(assessDuringChart.ok === false, `assess vs chart ${assessDuringChart.reason}`);
assert(
  assessDuringChart.reason === 'blocks-with'
    || assessDuringChart.reason === 'requires-empty-slots'
    || assessDuringChart.reason === 'exclusive-active',
  `assess vs chart reason ${assessDuringChart.reason}`
);

const med2 = taskSystem.createTask({
  id: 'p2-med',
  type: 'med',
  name: 'Med 2',
  scheduled: 1900,
  expire: '+60',
  durationMins: 10,
  patientId: 'p2'
});
taskSystem.processTasks(1922);
const medDuringChart = canEnterSlot(med2);
assert(medDuringChart.ok === false && medDuringChart.reason === 'exclusive-active', `med during chart ${medDuringChart.reason}`);
assert(String(medDuringChart.message || '').toLowerCase().includes('chart'), 'med block explains chart assessment');
assert(SlotSystem.requestSlot(med2, 1922).ok === false, 'assign med blocked during chart');

if (failures.length) {
  console.error('slot-constraints AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('slot-constraints AUTO PASS');
