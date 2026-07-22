/**
 * AUTO checks for E11 — orders carryover + sudden procedures.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';
import { normalizePack } from '../game/assets/js/scenario-pack.js';
import {
  resetDoctorOrders,
  processDoctorOrdersTime,
  handleOrdersCheckComplete,
  getCarryoverSpecs,
  isProcedureInjected,
  maybeInjectSuddenProcedure,
  nextMidnightExpire,
  addMinutesToHhmm,
  listProcedureEligiblePatients,
  injectOrderSpec
} from '../game/assets/js/doctor-orders.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

globalThis.document = {
  querySelector: () => ({
    querySelector: () => ({ appendChild() {} }),
    appendChild() {},
    contains: () => false,
    classList: { add() {}, remove() {} }
  }),
  getElementById: () => null,
  createElement: () => ({
    className: '',
    innerHTML: '',
    textContent: '',
    style: {},
    classList: { add() {}, remove() {} },
    setAttribute() {},
    appendChild() {},
    querySelector: () => null
  })
};

assert(existsSync(join(root, 'game/assets/js/doctor-orders.js')), 'doctor-orders.js');
assert(GameConfig.doctorOrders.durationMins === 5, 'check orders 5 min');
assert(GameConfig.doctorOrders.procedures?.maxPerGame === 1, 'max one procedure');
assert(Array.isArray(GameConfig.doctorOrders.procedures?.byDiagnosis), 'diagnosis catalog');

const taskSrc = readFileSync(join(root, 'game/assets/js/task-system.js'), 'utf8');
assert(taskSrc.includes("taskProcessors.set('procedure'"), 'procedure processor');

// --- Carryover: missed check queues pack injections ---
resetDoctorOrders();
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
const packRaw = JSON.parse(readFileSync(join(root, 'game/events/scenarios/night-shift-default.json'), 'utf8'));
const pack = normalizePack(packRaw, 'test');
gameState.dispatch('SET_SCENARIO_PACK', { pack });

processDoctorOrdersTime(1900);
const check1900 = gameState.getStateSlice('tasks').get('orders-check-1900');
assert(check1900, 'spawned check 1900');
assert(check1900.duration === 5, 'duration 5');

// Expire without completing
taskSystem.processTasks(2000);
assert(
  gameState.getStateSlice('tasks').get('orders-check-1900').status === GameConfig.tasks.statuses.OVERDUE,
  'check overdue'
);
processDoctorOrdersTime(2000);
const carryAfterMiss = getCarryoverSpecs();
assert(
  carryAfterMiss.some((s) => s.id === 'order-joe-new-ondansetron'),
  'missed check queues pack injection'
);

// Complete next hour — should deliver carryover
const check2000 = gameState.getStateSlice('tasks').get('orders-check-2000');
assert(check2000, 'spawned check 2000');
taskSystem.completeTask(check2000.id);
handleOrdersCheckComplete(gameState.getStateSlice('tasks').get(check2000.id), {
  now: 2000,
  random: () => 0.99,
  forceProcedure: false
});
assert(
  gameState.getStateSlice('tasks').has('order-joe-new-ondansetron'),
  'carryover injected on next check'
);

// --- Carryover: overdue injected order re-queues ---
resetDoctorOrders();
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
gameState.dispatch('SET_SCENARIO_PACK', { pack });
processDoctorOrdersTime(1900);
taskSystem.completeTask('orders-check-1900');
handleOrdersCheckComplete(gameState.getStateSlice('tasks').get('orders-check-1900'), {
  now: 1900,
  random: () => 0.99
});
const inj = gameState.getStateSlice('tasks').get('order-joe-new-ondansetron');
assert(inj, 'pack order injected');
// Force overdue
gameState.dispatch('MARK_OVERDUE', { taskId: inj.id });
processDoctorOrdersTime(2000);
assert(
  getCarryoverSpecs().some((s) => s.id === 'order-joe-new-ondansetron'),
  'overdue injected order in carryover'
);

// --- nextMidnight ---
assert(nextMidnightExpire(1900, 1900, 720) === 0, 'night shift before midnight → 0000');
assert(nextMidnightExpire(1000, 700, 720) === 0, 'day shift → next midnight 0000');

// --- Procedure: eligible + max one + sameDay lead + consent ---
resetDoctorOrders();
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
gameState.dispatch('REGISTER_PATIENT', {
  patient: { id: 'robert', name: 'Robert', diagnosis: 'NSTEMI rule-out' }
});
gameState.dispatch('REGISTER_PATIENT', {
  patient: { id: 'joe', name: 'Joe', diagnosis: 'Post-op Total Hip Replacement' }
});
const eligible = listProcedureEligiblePatients();
assert(eligible.some((e) => e.patient.id === 'robert'), 'robert eligible NSTEMI');
assert(!eligible.some((e) => e.patient.id === 'joe'), 'joe hip not in catalog');

const sameDay = maybeInjectSuddenProcedure({
  now: 1900,
  force: true,
  timing: 'sameDay',
  random: () => 0,
  procedureScheduled: addMinutesToHhmm(1900, 120)
});
assert(sameDay, 'forced sameDay procedure');
assert(sameDay.timing === 'sameDay', 'timing sameDay');
assert(isProcedureInjected(), 'procedureInjected flag');
const consent = gameState.getStateSlice('tasks').get(sameDay.consentId);
assert(consent?.metadata?.kind === 'procedure-consent', 'consent task');
assert(sameDay.procedureScheduled === 2100, 'sameDay at +120 → 2100');
const leadMins = (() => {
  const a = Math.floor(1900 / 100) * 60 + (1900 % 100);
  const b = Math.floor(sameDay.procedureScheduled / 100) * 60 + (sameDay.procedureScheduled % 100);
  let d = b - a;
  if (d < 0) d += 24 * 60;
  return d;
})();
assert(leadMins >= 120, `sameDay lead ≥120 got ${leadMins}`);

const second = maybeInjectSuddenProcedure({ now: 2000, force: true, timing: 'sameDay', random: () => 0 });
assert(second == null, 'max one procedure per game');

// --- tomorrow NPO expire midnight ---
resetDoctorOrders();
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
gameState.dispatch('REGISTER_PATIENT', {
  patient: { id: 'derek', name: 'Derek', diagnosis: 'COPD exacerbation' }
});
const tmr = maybeInjectSuddenProcedure({
  now: 2000,
  force: true,
  timing: 'tomorrow',
  random: () => 0
});
assert(tmr?.timing === 'tomorrow', 'tomorrow timing');
assert(tmr.npoExpire === 0, 'NPO expire midnight 0000');
const npo1 = gameState.getStateSlice('tasks').get(tmr.npoInformId);
const npo2 = gameState.getStateSlice('tasks').get(tmr.npoBoardId);
assert(npo1?.expire === 0 && npo1.metadata?.expireAtMidnight, 'inform NPO midnight');
assert(npo2?.expire === 0 && /whiteboard/i.test(npo2.name) && /CNA/i.test(npo2.name), 'board NPO + CNA');
assert(gameState.getStateSlice('tasks').get(tmr.consentId), 'tomorrow still has consent');

// injectOrderSpec helper smoke
const smoke = injectOrderSpec({
  id: 'smoke-order',
  type: 'med',
  name: 'Smoke',
  patientId: 'derek',
  scheduled: 2000,
  expire: '+30'
}, { now: 2000 });
assert(smoke?.id === 'smoke-order', 'injectOrderSpec');

if (failures.length) {
  console.error('E11 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E11 AUTO PASS');
