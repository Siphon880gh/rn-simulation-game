/**
 * AUTO checks for critical lab call → awaiting toast → 15m re-call → MD callback.
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
assert(GameConfig.criticalLabs.recallEveryMins === 15, '15m re-call cadence');
assert(
  typeof GameConfig.criticalLabs.awaitingToastMessage === 'string'
    && /dr will call back/i.test(GameConfig.criticalLabs.awaitingToastMessage),
  'awaiting toast copy'
);
assert(GameConfig.selectors.awaitingCallbackToast, 'toast selector');
assert(Array.isArray(GameConfig.criticalLabs.labs) && GameConfig.criticalLabs.labs.length >= 4, 'lab catalog');
assert(GameConfig.criticalLabs.labs.some((l) => l.id === 'k-high'), 'K+ lab');
assert(GameConfig.criticalLabs.labs.some((l) => l.id === 'hh-drop'), 'H/H lab');
assert(GameConfig.criticalLabs.labs.some((l) => l.id === 'blood-culture'), 'blood culture lab');
assert(GameConfig.criticalLabs.labs.some((l) => l.id === 'abg-resp-acidosis'), 'ABG respiratory acidosis lab');
assert(GameConfig.criticalLabs.labs.some((l) => l.id === 'abg-met-acidosis'), 'ABG metabolic acidosis lab');
assert(Array.isArray(GameConfig.criticalLabs.schedule) && GameConfig.criticalLabs.schedule.length >= 1, 'schedule');

const abg = GameConfig.criticalLabs.labs.find((l) => l.id === 'abg-resp-acidosis');
assert(abg && /pH/i.test(abg.result) && /PaCO|CO₂|CO2/i.test(abg.result) && /HCO/i.test(abg.result), 'ABG result includes pH / CO2 / HCO3');

GameConfig.criticalLabs.labs.forEach((lab) => {
  assert(typeof lab.result === 'string' && lab.result.length > 8, `${lab.id} has a critical result string`);
  assert(/critical|positive|ACS|acidosis|high|low|Staph/i.test(lab.result), `${lab.id} result reads clinically bad`);
  assert(Array.isArray(lab.callbackEffects) && lab.callbackEffects.length >= 1, `${lab.id} has callbackEffects`);
  lab.callbackEffects.forEach((fx, i) => {
    assert(fx.name && (fx.type === 'med' || fx.type === 'assessment'), `${lab.id} effect[${i}] typed`);
  });
});

const bcx = GameConfig.criticalLabs.labs.find((l) => l.id === 'blood-culture');
assert(
  bcx?.callbackEffects?.some((fx) => /vancomycin|antibiotic/i.test(fx.name)),
  'blood culture callback spawns antibiotic'
);

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(appSrc.includes('CriticalLabsModule') || appSrc.includes('critical-labs'), 'app wires critical labs');
assert(appSrc.includes('performCriticalLabTask'), 'performCriticalLabTask');
assert(appSrc.includes('data-task-type="criticallab"'), 'context menu selector');
assert(appSrc.includes('handleCriticalLabRecallComplete'), 'app wires recall complete');
assert(appSrc.includes('Call doctor again'), 'recall perform label');

const htmlSrc = readFileSync(join(root, 'game/index.html'), 'utf8');
assert(htmlSrc.includes('shell-awaiting-callback-toast'), 'toast mount in shell');

const cssSrc = readFileSync(join(root, 'game/assets/css/shell.css'), 'utf8');
assert(cssSrc.includes('shell-awaiting-toast'), 'toast styles');

assert(_addMinutesToHhmm(2015, 60) === 2115, '2015+60 → 2115');
assert(_addMinutesToHhmm(2310, 60) === 10, '2310+60 → 0010');
assert(_addMinutesToHhmm(2015, 15) === 2030, '2015+15 → 2030 recall due');

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
assert(isAtOrAfterInShift(2030, 2030), 'recall due at +15');
assert(!isAtOrAfterInShift(2029, 2030), 'not yet at recall');

const modSrc = readFileSync(join(root, 'game/assets/js/critical-labs.js'), 'utf8');
assert(modSrc.includes('handleCriticalLabCallComplete'), 'call complete handler');
assert(modSrc.includes('handleCriticalLabRecallComplete'), 'recall complete handler');
assert(modSrc.includes('handleCriticalLabCallbackComplete'), 'callback complete handler');
assert(modSrc.includes('applyCallbackEffects'), 'callback side-effect spawner');
assert(modSrc.includes('fromCriticalLabCallback'), 'effect task metadata');
assert(modSrc.includes('pendingCallbacks'), 'pending callback queue');
assert(modSrc.includes('showAwaitingCallbackToast'), 'awaiting toast helper');
assert(modSrc.includes('critical-lab-recall'), 'recall task kind');
assert(modSrc.includes('processPendingRecalls'), 'recall processor');
assert(modSrc.includes('Dr will call back') || modSrc.includes('awaitingToastMessage'), 'toast message path');

if (failures.length) {
  console.error('CRITICAL LABS AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('CRITICAL LABS AUTO PASS');
