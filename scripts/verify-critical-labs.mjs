/**
 * AUTO checks for critical lab call → MD callback module.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import {
  pickCallbackAt,
  _addMinutesToHhmm
} from '../game/assets/js/critical-labs.js';
import { setShiftAnchor, isAtOrAfterInShift } from '../game/assets/js/availability-windows.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/critical-labs.js')), 'critical-labs.js');
assert(GameConfig.tasks.types.CRITICALLAB, 'CRITICALLAB task type');
assert(GameConfig.criticalLabs.callWindowMins === 60, '1h call window');
assert(Array.isArray(GameConfig.criticalLabs.labs) && GameConfig.criticalLabs.labs.length >= 4, 'lab catalog');
assert(GameConfig.criticalLabs.labs.some((l) => l.id === 'k-high'), 'K+ lab');
assert(GameConfig.criticalLabs.labs.some((l) => l.id === 'hh-drop'), 'H/H lab');
assert(GameConfig.criticalLabs.labs.some((l) => l.id === 'blood-culture'), 'blood culture lab');
assert(Array.isArray(GameConfig.criticalLabs.schedule) && GameConfig.criticalLabs.schedule.length >= 1, 'schedule');

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(appSrc.includes('CriticalLabsModule') || appSrc.includes('critical-labs'), 'app wires critical labs');
assert(appSrc.includes('performCriticalLabTask'), 'performCriticalLabTask');
assert(appSrc.includes('data-task-type="criticallab"'), 'context menu selector');

assert(_addMinutesToHhmm(2015, 60) === 2115, '2015+60 → 2115');
assert(_addMinutesToHhmm(2310, 60) === 10, '2310+60 → 0010');

// Immediate path
const immediate = pickCallbackAt(2015, 2115, () => 0);
assert(immediate === 2015, `immediate callback at call time, got ${immediate}`);

// Delayed path — force non-immediate, delay in range
let roll = 0;
const delayed = pickCallbackAt(2015, 2115, () => {
  roll += 1;
  // first roll: immediate chance check → 0.99 = delay
  // second uses Math.floor(random() * span) — return 0 for min delay
  return roll === 1 ? 0.99 : 0;
});
assert(delayed > 2015 && delayed < 2115, `delayed callback inside window, got ${delayed}`);
assert(delayed === 2020, `min delay 5m → 2020, got ${delayed}`);

// Late call: remaining < min delay → still before window end
const late = pickCallbackAt(2110, 2115, () => 0.99);
assert(late >= 2110 && late < 2115, `late call still inside window, got ${late}`);

setShiftAnchor(1900);
assert(isAtOrAfterInShift(2015, 2015), 'lab due at 2015');
assert(!isAtOrAfterInShift(2000, 2015), 'not yet at 2015');
assert(isAtOrAfterInShift(30, 30), '0030 trop due');

const modSrc = readFileSync(join(root, 'game/assets/js/critical-labs.js'), 'utf8');
assert(modSrc.includes('handleCriticalLabCallComplete'), 'call complete handler');
assert(modSrc.includes('handleCriticalLabCallbackComplete'), 'callback complete handler');
assert(modSrc.includes('pendingCallbacks'), 'pending callback queue');

if (failures.length) {
  console.error('CRITICAL LABS AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('CRITICAL LABS AUTO PASS');
