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
  resetDoctorOrders
} from '../game/assets/js/doctor-orders.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

globalThis.document = {
  querySelector: () => ({
    querySelector: () => ({ appendChild() {} }),
    appendChild() {},
    contains: () => false
  }),
  getElementById: () => null,
  createElement: () => ({
    className: '',
    innerHTML: '',
    style: {},
    classList: { add() {}, remove() {} },
    setAttribute() {},
    appendChild() {},
    querySelector: () => null
  })
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

if (failures.length) {
  console.error('E4.M3 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E4.M3 AUTO PASS');
