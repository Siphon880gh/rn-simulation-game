/**
 * AUTO checks for E3.M2 slot execution.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';
import SlotSystem from '../game/assets/js/slot-system.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
const patientsSrc = readFileSync(join(root, 'game/assets/js/patients.js'), 'utf8');
const css = readFileSync(join(root, 'game/assets/css/declarative-tasks.css'), 'utf8');

assert(GameConfig.slots.count === 3, '3 slots');
assert(existsSync(join(root, 'game/assets/js/slot-system.js')), 'slot-system.js');
assert(appSrc.includes('SlotSystem'), 'app wires slots');
assert(appSrc.includes('requestSlot') || appSrc.includes('tryAssignTask'), 'perform uses slots');
assert(patientsSrc.includes('context menu owned by app.js'), 'menus consolidated');
assert(css.includes('task-slot-timemark'), 'duration timemark CSS');
assert(css.includes('task-slot-progress-fill'), 'progress CSS');

gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
assert((gameState.getStateSlice('slots') || []).length === 3, 'slots initialized');

const t1 = taskSystem.createTask({
  id: 'slot-t1', type: 'med', name: 'Slot Med A', scheduled: 1900, expire: '+60', durationMins: 10, patientId: 'joe'
});
taskSystem.processTasks(1900);

assert(SlotSystem.tryAssignTask(t1, 1900) === true, 'assign first');
assert(SlotSystem.hasFreeSlot() === true, 'still free after 1');

const t2 = taskSystem.createTask({
  id: 'slot-t2', type: 'med', name: 'Slot Med B', scheduled: 1900, expire: '+60', durationMins: 10, patientId: 'joe'
});
const t3 = taskSystem.createTask({
  id: 'slot-t3', type: 'med', name: 'Slot Med C', scheduled: 1900, expire: '+60', durationMins: 10, patientId: 'joe'
});
assert(SlotSystem.tryAssignTask(t2, 1900) === true, 'assign second');
assert(SlotSystem.tryAssignTask(t3, 1900) === true, 'assign third');
assert(SlotSystem.hasFreeSlot() === false, 'full');

const t4 = taskSystem.createTask({
  id: 'slot-t4', type: 'med', name: 'Slot Med D', scheduled: 1900, expire: '+60', durationMins: 10, patientId: 'joe'
});
assert(SlotSystem.tryAssignTask(t4, 1900) === false, 'blocked when full');

const busy = gameState.getStateSlice('slots').find((s) => s.taskId === 'slot-t1');
assert(busy && busy.endsAt === 1910, `endsAt duration timemark got ${busy?.endsAt}`);

SlotSystem.processSlots(1910);
assert(!gameState.getStateSlice('slots').some((s) => s.taskId === 'slot-t1'), 'released on end');
assert(
  gameState.getStateSlice('tasks').get('slot-t1').status === GameConfig.tasks.statuses.COMPLETED,
  'completed after slot'
);

if (failures.length) {
  console.error('E3.M2 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E3.M2 AUTO PASS');
