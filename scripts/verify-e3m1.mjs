/**
 * AUTO checks for E3.M1 task schema + lifecycle actions.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const stateSrc = readFileSync(join(root, 'game/assets/js/game-state.js'), 'utf8');
const taskSrc = readFileSync(join(root, 'game/assets/js/task-system.js'), 'utf8');

assert(GameConfig.tasks.schemaVersion === 1, 'schemaVersion');
assert(GameConfig.tasks.classes.ROUTINE === 'routine', 'task classes');
assert(stateSrc.includes("actions.set('MARK_OVERDUE'"), 'MARK_OVERDUE action');
assert(taskSrc.includes('normalizeTaskData'), 'normalizeTaskData');
assert(taskSrc.includes("MARK_OVERDUE"), 'processTasks dispatches overdue');
assert(!/livequery/i.test(taskSrc), 'no liveQuery in task-system');

const task = taskSystem.createTask({
  id: 'e3m1-test-med',
  type: 'med',
  taskClass: 'urgent',
  name: 'Test Med',
  scheduled: 1900,
  expire: '+30',
  durationMins: 10,
  patientId: 'joe'
});

assert(task.schemaVersion === 1, 'task schemaVersion');
assert(task.type === 'med', 'type');
assert(task.taskClass === 'urgent', 'taskClass');
assert(task.scheduled === 1900, 'scheduled');
assert(task.expire === 1930, `expire relative got ${task.expire}`);
assert(task.duration === 10, 'duration');
assert(task.status === GameConfig.tasks.statuses.NOT_YET, 'initial status');
assert(gameState.getStateSlice('tasks').has('e3m1-test-med'), 'REGISTER_TASK');

taskSystem.processTasks(1900);
assert(
  gameState.getStateSlice('tasks').get('e3m1-test-med').status === GameConfig.tasks.statuses.ACTIVE,
  'activate via ACTIVATE_TASK'
);

taskSystem.processTasks(1931);
assert(
  gameState.getStateSlice('tasks').get('e3m1-test-med').status === GameConfig.tasks.statuses.OVERDUE,
  'overdue via MARK_OVERDUE'
);

taskSystem.completeTask('e3m1-test-med');
assert(
  gameState.getStateSlice('tasks').get('e3m1-test-med').status === GameConfig.tasks.statuses.COMPLETED,
  'complete via COMPLETE_TASK'
);

if (failures.length) {
  console.error('E3.M1 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E3.M1 AUTO PASS');
