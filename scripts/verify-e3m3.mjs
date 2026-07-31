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
  getTaskWindowBounds,
  isPerformAllowed,
  buildRevealRule,
  setShiftAnchor
} from '../game/assets/js/availability-windows.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/availability-windows.js')), 'availability-windows.js');
assert(GameConfig.tasks.availability.gatePerform === true, 'gatePerform config');
assert(GameConfig.tasks.availability.medEarlyMins === 60, 'medEarlyMins 60');
assert(GameConfig.tasks.availability.medLateMins === 60, 'medLateMins 60');

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
const timerSrc = readFileSync(join(root, 'game/assets/js/timer_ingame.js'), 'utf8');
const patientsSrc = readFileSync(join(root, 'game/assets/js/patients.js'), 'utf8');
const cssSrc = readFileSync(join(root, 'game/assets/css/declarative-tasks.css'), 'utf8');
assert(appSrc.includes('isPerformAllowed'), 'perform gated');
assert(appSrc.includes('disabled: !canPerform'), 'context menu disables Perform');
assert(timerSrc.includes('data-expire'), 'reveal rules include expire');
assert(timerSrc.includes('expireRaw'), 'reveal keeps +N raw selector');
assert(patientsSrc.includes('task-section-chevron'), 'section chevrons');
assert(patientsSrc.includes('showMedicationWindowHelp'), 'med window help wired');
assert(cssSrc.includes('task-section-chevron'), 'chevron CSS');
assert(cssSrc.includes('task-section-help'), 'med help CSS');

setShiftAnchor(1900);
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });

const task = taskSystem.createTask({
  id: 'win-heparin',
  type: 'med',
  name: 'Heparin',
  scheduled: 2100,
  expire: '+90',
  durationMins: 10,
  patientId: 'joe'
});
assert(task.expire === 2230, `relative expire resolved got ${task.expire}`);
assert(task.metadata.expireRaw === '+90', 'expireRaw preserved');

const bounds = getTaskWindowBounds(task);
assert(bounds.start === 2000, `med early start got ${bounds.start}`);
assert(bounds.due === 2100, 'med due is scheduled');
assert(bounds.expire === 2230, 'med expire unchanged');

// Shift-start clamp: due near shift open cannot open before anchor
const earlyShiftMed = taskSystem.createTask({
  id: 'win-early-shift-med',
  type: 'med',
  name: 'Shift-start med',
  scheduled: 1930,
  expire: 2030,
  durationMins: 10
});
assert(getTaskWindowBounds(earlyShiftMed).start === 1900, 'early clamped to shift start');

// Before early edge — not yet
taskSystem.processTasks(1959);
let live = gameState.getStateSlice('tasks').get('win-heparin');
assert(live.status === GameConfig.tasks.statuses.NOT_YET, 'not active before early window');
assert(isPerformAllowed(live, 1959) === false, 'no perform before early window');
assert(getWindowPhase(live, 1959) === 'before', 'before phase');

// Inside early hour (due − 60)
taskSystem.processTasks(2000);
live = gameState.getStateSlice('tasks').get('win-heparin');
assert(live.status === GameConfig.tasks.statuses.ACTIVE, 'activated at early edge');
assert(isPerformAllowed(live, 2000) === true, 'perform at early edge');
assert(getWindowPhase(live, 2000) === 'early', 'early phase at window open');

taskSystem.processTasks(2100);
live = gameState.getStateSlice('tasks').get('win-heparin');
assert(live.status === GameConfig.tasks.statuses.ACTIVE, 'still active at due');
assert(isPerformAllowed(live, 2100) === true, 'perform at due');
// Window 2000–2230 (150m): 2100 = 60/150 → late
assert(getWindowPhase(live, 2100) === 'late', 'late phase mid-window');
assert(getWindowPhase(live, 2200) === 'end', 'end phase');
assert(isPerformAllowed(live, 2231) === false, 'no perform after expire');
assert(getWindowPhase(live, 2231) === 'after', 'after phase');

// Non-med keeps scheduled as window start
const assess = taskSystem.createTask({
  id: 'win-assess',
  type: 'assessment',
  name: 'Assess',
  scheduled: 2000,
  expire: 2100,
  durationMins: 10
});
const assessBounds = getTaskWindowBounds(assess);
assert(assessBounds.start === 2000, 'assessment start = scheduled');
taskSystem.processTasks(1930);
const assessLive = gameState.getStateSlice('tasks').get('win-assess');
assert(assessLive.status === GameConfig.tasks.statuses.NOT_YET, 'assessment not early');

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
