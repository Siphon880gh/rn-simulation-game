/**
 * AUTO checks for E4.M3 hourly check doctor orders.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';
import { normalizePack } from '../game/assets/js/scenario-pack.js';
import {
  getHourWindow,
  processDoctorOrdersTime,
  handleOrdersCheckComplete,
  resetDoctorOrders,
  maybeInjectTrivialOrder,
  getTrivialOrderChance,
  getTrivialOrderOdds
} from '../game/assets/js/doctor-orders.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

function stubEl() {
  return {
    className: '',
    innerHTML: '',
    textContent: '',
    style: {},
    hidden: true,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {},
    getAttribute: () => null,
    removeAttribute() {},
    appendChild() {},
    addEventListener() {},
    removeEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
    contains: () => false,
    getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 })
  };
}

// querySelector → null so mountTaskDom skips (no patient panel hosts in Node)
globalThis.document = {
  body: stubEl(),
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  createElement: () => stubEl()
};

assert(existsSync(join(root, 'game/assets/js/doctor-orders.js')), 'doctor-orders.js');
assert(GameConfig.tasks.types.ORDERS, 'orders task type');
assert(GameConfig.doctorOrders.taskType === 'orders', 'doctorOrders config');

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
const html = readFileSync(join(root, 'game/index.html'), 'utf8');
assert(appSrc.includes('DoctorOrdersModule'), 'app wires doctor orders');
assert(appSrc.includes('performOrdersCheck'), 'orders perform path');
assert(html.includes('id="doctor-orders-list"'), 'global list mount');

const packRaw = JSON.parse(readFileSync(join(root, 'game/events/scenarios/night-shift-default.json'), 'utf8'));
const pack = normalizePack(packRaw, 'test');
assert(Array.isArray(pack.orderInjections['1900']), 'pack orderInjections');

resetDoctorOrders();
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
gameState.dispatch('SET_SCENARIO_PACK', { pack });

const win = getHourWindow(1900, 1900, 720);
assert(win.hourStart === 1900 && win.hourEnd === 2000, 'hour window 1900-2000');

processDoctorOrdersTime(1900);
const check = gameState.getStateSlice('tasks').get('orders-check-1900');
assert(check, 'spawned hourly check');
assert(check.type === 'orders', 'type orders');
assert(check.expire === 2000, `expire end of hour got ${check.expire}`);
assert(check.status === GameConfig.tasks.statuses.ACTIVE, 'active at hour start');

taskSystem.processTasks(2000);
assert(
  gameState.getStateSlice('tasks').get('orders-check-1900').status === GameConfig.tasks.statuses.OVERDUE,
  'overdue at next hour'
);

processDoctorOrdersTime(2000);
assert(gameState.getStateSlice('tasks').has('orders-check-2000'), 'next hour check spawned');

// Complete a fresh check with injections (re-init hour 1900 path via direct complete)
resetDoctorOrders();
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
gameState.dispatch('SET_SCENARIO_PACK', { pack });
processDoctorOrdersTime(1900);
const check2 = gameState.getStateSlice('tasks').get('orders-check-1900');
taskSystem.completeTask(check2.id);
handleOrdersCheckComplete(gameState.getStateSlice('tasks').get(check2.id));
assert(
  gameState.getStateSlice('tasks').has('order-joe-new-ondansetron'),
  'injects pack order on complete'
);

// Trivial-order dice: chance config + force inject + miss path
assert(Number.isFinite(getTrivialOrderChance()), 'trivial chance configured');
assert(getTrivialOrderOdds().length === 2, 'trivial odds generate vs not');
assert(
  GameConfig.doctorOrders.trivialOrders?.catalog?.length > 0,
  'trivial catalog'
);

resetDoctorOrders();
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
gameState.dispatch('SET_SCENARIO_PACK', { pack });
gameState.dispatch('REGISTER_PATIENT', {
  patient: { id: 'joe', name: 'Joe Johnson', room: 'Room 201-A', diagnosis: 'Hip' }
});
processDoctorOrdersTime(1900);
const check3 = gameState.getStateSlice('tasks').get('orders-check-1900');
taskSystem.completeTask(check3.id);
handleOrdersCheckComplete(gameState.getStateSlice('tasks').get(check3.id), {
  now: 1900,
  random: () => 0.99,
  forceTrivial: true,
  trivialPatientId: 'joe',
  trivialTemplate: {
    type: 'assessment',
    name: 'Incentive spirometry teaching',
    durationMins: 5
  },
  showToast: false
});
const trivial = [...gameState.getStateSlice('tasks').values()]
  .find((t) => t.metadata?.kind === 'trivial-order');
assert(trivial, 'forceTrivial injects trivial order');
assert(trivial.patientId === 'joe', 'trivial scoped to patient');
assert(/spirometry/i.test(trivial.name), 'trivial uses template name');

const miss = maybeInjectTrivialOrder({
  now: 2000,
  random: () => 0.99,
  showToast: false
});
assert(miss == null, 'high roll skips trivial order');

if (failures.length) {
  console.error('E4.M3 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E4.M3 AUTO PASS');
