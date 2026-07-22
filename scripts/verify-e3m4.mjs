/**
 * AUTO checks for E3.M4 task class interaction durations.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import {
  resolveEffectiveDuration,
  setLastReleasedClass,
  resetClassInteractions
} from '../game/assets/js/task-class-interactions.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/task-class-interactions.js')), 'module');
assert(GameConfig.taskClassInteractions.enabled === true, 'enabled');
assert(GameConfig.taskClassInteractions.sameClassDeltaMins === -2, 'batch delta');
assert(GameConfig.taskClassInteractions.contextSwitchDeltaMins === 3, 'switch delta');

const slotSrc = readFileSync(join(root, 'game/assets/js/slot-system.js'), 'utf8');
assert(slotSrc.includes('resolveEffectiveDuration'), 'slots use effective duration');
assert(slotSrc.includes('setLastReleasedClass'), 'slots track last class');

resetClassInteractions();
const first = resolveEffectiveDuration({ duration: 10, taskClass: 'routine' });
assert(first.duration === 10 && first.adjustment === 0, 'no prior class');

setLastReleasedClass('routine');
const batch = resolveEffectiveDuration({ duration: 10, taskClass: 'routine' });
assert(batch.duration === 8 && batch.adjustment === -2, `batch got ${batch.duration}`);
assert(/batch/.test(batch.reason || ''), 'batch reason');

const switched = resolveEffectiveDuration({ duration: 10, taskClass: 'urgent' }, 'routine');
assert(switched.duration === 13 && switched.adjustment === 3, `switch got ${switched.duration}`);
assert(/context-switch/.test(switched.reason || ''), 'switch reason');

const floor = resolveEffectiveDuration({ duration: 1, taskClass: 'routine' }, 'routine');
assert(floor.duration === 1, 'duration floors at 1');

if (failures.length) {
  console.error('E3.M4 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E3.M4 AUTO PASS');
