/**
 * AUTO checks for E4.M2 game-time event drip + thin deterioration.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';
import { normalizePack } from '../game/assets/js/scenario-pack.js';
import { processGameTime, resetEventDrip } from '../game/assets/js/event-drip.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

globalThis.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {},
    getAttribute: () => '',
    textContent: '',
    appendChild() {},
    prepend() {}
  })
};

assert(existsSync(join(root, 'game/assets/js/event-drip.js')), 'event-drip.js');
const packRaw = JSON.parse(readFileSync(join(root, 'game/events/scenarios/night-shift-default.json'), 'utf8'));
assert(Array.isArray(packRaw.events) && packRaw.events.length >= 2, 'pack authored events');
const pack = normalizePack(packRaw, 'test');
assert(pack.events.length >= 2, 'normalize keeps events');
assert(GameConfig.events.deterioration.steps.includes('worsening'), 'deterioration steps');

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(appSrc.includes('EventDripModule'), 'app wires event drip');

resetEventDrip();
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
gameState.dispatch('SET_SCENARIO_PACK', { pack });
gameState.dispatch('REGISTER_PATIENT', {
  patient: {
    id: 'maria',
    name: 'Maria Santos',
    clinicalStatus: 'stable',
    status: 'active'
  }
});
gameState.dispatch('REGISTER_PATIENT', {
  patient: {
    id: 'robert',
    name: 'Robert Hale',
    clinicalStatus: 'stable',
    status: 'active'
  }
});

processGameTime(2000);
assert(
  (gameState.getStateSlice('firedEvents') || []).some((e) => e.eventId === 'rr-admit-2000'),
  'emergency event fired at 2000'
);
assert(gameState.getStateSlice('tasks').has('evt-maria-rr-assess'), 'injected follow-on task');
assert(
  (gameState.getStateSlice('shiftLog') || []).some((e) => /Rapid response/i.test(e.message)),
  'history log entry'
);

const overdue = taskSystem.createTask({
  id: 'det-overdue-maria',
  type: 'med',
  name: 'Late med',
  scheduled: 1900,
  expire: '+10',
  durationMins: 5,
  patientId: 'maria',
  taskClass: 'urgent'
});
taskSystem.processTasks(1900);
taskSystem.processTasks(1915);
assert(
  gameState.getStateSlice('tasks').get(overdue.id).status === GameConfig.tasks.statuses.OVERDUE,
  'task overdue'
);
processGameTime(1915);
assert(
  gameState.getStateSlice('patients').get('maria').clinicalStatus === 'watch',
  'thin deterioration → watch'
);

if (failures.length) {
  console.error('E4.M2 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E4.M2 AUTO PASS');
