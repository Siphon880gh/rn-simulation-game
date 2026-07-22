/**
 * AUTO checks for E3.M3 availability windows.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';
import {
  getWindowPhase,
  isPerformAllowed,
  buildRevealRule
} from '../game/assets/js/availability-windows.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/availability-windows.js')), 'availability-windows.js');
assert(GameConfig.tasks.availability.gatePerform === true, 'gatePerform config');

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
const timerSrc = readFileSync(join(root, 'game/assets/js/timer_ingame.js'), 'utf8');
assert(appSrc.includes('isPerformAllowed'), 'perform gated');
assert(appSrc.includes('disabled: !canPerform'), 'context menu disables Perform');
assert(timerSrc.includes('data-expire'), 'reveal rules include expire');
assert(timerSrc.includes('expireRaw'), 'reveal keeps +N raw selector');

gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });

const task = taskSystem.createTask({
  id: 'win-heparin',
  type: 'med',
  name: 'Heparin',
  scheduled: 1900,
  expire: '+90',
  durationMins: 10,
  patientId: 'joe'
});
assert(task.expire === 2030, `relative expire resolved got ${task.expire}`);
assert(task.metadata.expireRaw === '+90', 'expireRaw preserved');

taskSystem.processTasks(1900);
const active = gameState.getStateSlice('tasks').get('win-heparin');
assert(active.status === GameConfig.tasks.statuses.ACTIVE, 'activated');
assert(isPerformAllowed(active, 1900) === true, 'perform at start');
assert(getWindowPhase(active, 1900) === 'early', 'early phase');
assert(getWindowPhase(active, 1945) === 'late', 'late phase');
assert(getWindowPhase(active, 2015) === 'end', 'end phase');
assert(isPerformAllowed(active, 2031) === false, 'no perform after expire');
assert(getWindowPhase(active, 2031) === 'after', 'after phase');

const rule = buildRevealRule(2100, 2300, '+120');
assert(rule.includes('data-scheduled="2100"'), 'reveal scheduled');
assert(rule.includes('data-expire="2300"'), 'reveal absolute expire');
assert(rule.includes('data-expire="+120"'), 'reveal relative expire');

if (failures.length) {
  console.error('E3.M3 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E3.M3 AUTO PASS');
