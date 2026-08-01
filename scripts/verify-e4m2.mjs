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

// E9: patient-bound emergencies must not fire while target is admit-held.
function resetCensusState() {
  resetEventDrip();
  gameState.state.patients = new Map();
  gameState.state.tasks = new Map();
  gameState.state.firedEvents = [];
  gameState.state.shiftLog = [];
  gameState.state.admitHold = null;
  gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
}

const icuRaw = JSON.parse(readFileSync(join(root, 'game/events/scenarios/icu-2.json'), 'utf8'));
const icuPack = normalizePack(icuRaw, 'icu-hold-test');

resetCensusState();
gameState.dispatch('SET_SCENARIO_PACK', { pack: icuPack });
gameState.dispatch('REGISTER_PATIENT', {
  patient: {
    id: 'lyle',
    name: 'Lyle Okonkwo',
    clinicalStatus: 'watch',
    status: 'active'
  }
});
gameState.dispatch('SET_ADMIT_HOLD', {
  heldPatientId: 'robert',
  mode: 'admitMiddle',
  admitAt: 2100,
  windowKey: 'middle',
  spawned: false
});

processGameTime(1930);
assert(
  !(gameState.getStateSlice('firedEvents') || []).some((e) => e.eventId === 'icu-lab-critical-1930'),
  'Critical K+ deferred while robert admit-held'
);
assert(
  !gameState.getStateSlice('tasks')?.has('evt-icu-robert-k'),
  'no Critical K+ task for held robert'
);

gameState.dispatch('REGISTER_PATIENT', {
  patient: {
    id: 'robert',
    name: 'Robert Hale',
    clinicalStatus: 'worsening',
    status: 'active'
  }
});
gameState.dispatch('UPDATE_ADMIT_HOLD', { spawned: true });
processGameTime(1931);
assert(
  (gameState.getStateSlice('firedEvents') || []).some((e) => e.eventId === 'icu-lab-critical-1930'),
  'Critical K+ fires after robert admitted'
);
assert(
  gameState.getStateSlice('tasks')?.has('evt-icu-robert-k'),
  'Critical K+ task after admit spawn'
);

// minus1: held patient never arrives — drop event once, no incident task.
resetCensusState();
gameState.dispatch('SET_SCENARIO_PACK', { pack: icuPack });
gameState.dispatch('REGISTER_PATIENT', {
  patient: {
    id: 'lyle',
    name: 'Lyle Okonkwo',
    clinicalStatus: 'watch',
    status: 'active'
  }
});
gameState.dispatch('SET_ADMIT_HOLD', {
  heldPatientId: 'robert',
  mode: 'minus1',
  spawned: false
});
processGameTime(1930);
assert(
  !gameState.getStateSlice('tasks')?.has('evt-icu-robert-k'),
  'minus1: no Critical K+ for held robert'
);
assert(
  !(gameState.getStateSlice('firedEvents') || []).some((e) => e.eventId === 'icu-lab-critical-1930'),
  'minus1: Critical K+ not logged as fired emergency'
);
processGameTime(1935);
assert(
  !gameState.getStateSlice('tasks')?.has('evt-icu-robert-k'),
  'minus1: stays suppressed on later ticks'
);

if (failures.length) {
  console.error('E4.M2 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E4.M2 AUTO PASS');
