/**
 * AUTO checks for declarative queue-slot concurrency constraints.
 *
 * Shift/chart assessments only mutex against other shift/chart assessments —
 * they must not exclusive-lock the whole queue (other tasks stay allowed).
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
  GameConfig.slotConstraints.rules.some((r) => r.type === 'mutexSimilar' && r.match?.kind === 'chart-assessment'),
  'mutex chart-assessment rule'
);
assert(
  !GameConfig.slotConstraints.rules.some((r) => r.type === 'requiresEmptySlots' && r.match?.kind === 'chart-assessment'),
  'no exclusive/empty-slots chart rule'
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
assert(chartVsAssess.ok === false && chartVsAssess.reason === 'blocks-with', `chart reason ${chartVsAssess.reason}`);

const medDuringAssess = canEnterSlot(med);
assert(medDuringAssess.ok === true, 'med allowed while shift assessment busy');
assert(SlotSystem.requestSlot(med, 1900).ok === true, 'assign med during assess');
assert(isExclusiveOccupancyActive() === false, 'no exclusive during assess');
assert(slotDisplayState({ id: 2, taskId: null }) === 'empty', 'empty slot stays empty (not disabled)');

SlotSystem.processSlots(1912);
assert(!SlotSystem.findSlotForTask(assessA.id), 'assess A finished');

assert(canEnterSlot(chartA).ok === true, 'chart ok after assess done');
assert(SlotSystem.requestSlot(chartA, 1912).ok === true, 'assign chart while med may still be busy');
assert(isExclusiveOccupancyActive() === false, 'chart is not exclusive');

const chartMutex = canEnterSlot(chartB);
assert(chartMutex.ok === false && chartMutex.reason === 'mutex-similar', `chart mutex got ${chartMutex.reason}`);

const assessDuringChart = canEnterSlot(assessB);
assert(assessDuringChart.ok === false && assessDuringChart.reason === 'blocks-with', `assess vs chart ${assessDuringChart.reason}`);

// Med should still be allowed alongside chart (if a free slot remains / after med frees)
SlotSystem.processSlots(1922);
assert(canEnterSlot(med).ok === true || SlotSystem.findSlotForTask(med.id), 'med allowed with chart');

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
assert(canEnterSlot(med2).ok === true, 'other meds ok during chart');
assert(SlotSystem.requestSlot(med2, 1922).ok === true, 'assign med during chart');

if (failures.length) {
  console.error('slot-constraints AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('slot-constraints AUTO PASS');
