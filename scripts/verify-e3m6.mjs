/**
 * AUTO checks for E3.M6 waiting queue auto-assign.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';
import SlotSystem from '../game/assets/js/slot-system.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const html = readFileSync(join(root, 'game/index.html'), 'utf8');
const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
const slotSrc = readFileSync(join(root, 'game/assets/js/slot-system.js'), 'utf8');

assert(html.includes('id="slot-waiting-queue"'), 'queue mount');
assert(appSrc.includes('requestSlot'), 'perform uses requestSlot');
assert(slotSrc.includes('ENQUEUE_SLOT_TASK'), 'enqueue');
assert(slotSrc.includes('drainQueue'), 'auto-assign drain');
assert(GameConfig.slots.queueSelector === '#slot-waiting-queue', 'queue selector');

gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });

const make = (id, name) => taskSystem.createTask({
  id, type: 'med', name, scheduled: 1900, expire: '+120', durationMins: 10, patientId: 'joe'
});

const a = make('q-a', 'Queue A');
const b = make('q-b', 'Queue B');
const c = make('q-c', 'Queue C');
const d = make('q-d', 'Queue D');

assert(SlotSystem.requestSlot(a, 1900).ok && !SlotSystem.requestSlot(a, 1900).queued, 'A starts');
assert(SlotSystem.requestSlot(b, 1900).ok, 'B starts');
assert(SlotSystem.requestSlot(c, 1900).ok, 'C starts');
const queued = SlotSystem.requestSlot(d, 1900);
assert(queued.ok && queued.queued, 'D queued when full');
assert(gameState.getStateSlice('slotQueue').some((i) => i.taskId === 'q-d'), 'D in slotQueue');

SlotSystem.processSlots(1910); // finishes A/B/C if all started 1900 for 10 min
assert(
  gameState.getStateSlice('slots').some((s) => s.taskId === 'q-d'),
  'D auto-assigned after a slot frees'
);
assert(
  !gameState.getStateSlice('slotQueue').some((i) => i.taskId === 'q-d'),
  'D removed from queue'
);

if (failures.length) {
  console.error('E3.M6 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E3.M6 AUTO PASS');
