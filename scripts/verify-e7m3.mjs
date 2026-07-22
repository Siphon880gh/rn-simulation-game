/**
 * AUTO checks for E7.M3 richer acuity + alternate shift pack.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import { normalizePack } from '../game/assets/js/scenario-pack.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const steps = GameConfig.events.deterioration.steps;
assert(steps.includes('critical'), 'critical status step');
assert(steps.indexOf('critical') > steps.indexOf('worsening'), 'critical after worsening');
assert(GameConfig.events.codeBlueHook.escalateAtStatus === 'critical', 'escalate at critical');
assert(GameConfig.scenario.availablePacks?.length >= 2, 'multiple shift packs');

const dayPath = join(root, 'game/events/scenarios/day-shift-medsurg.json');
assert(existsSync(dayPath), 'day shift pack');
const day = normalizePack(JSON.parse(readFileSync(dayPath, 'utf8')), dayPath);
assert(day.shiftStart === 700, 'day shiftStart');
assert(day.events.length >= 1, 'day events');

const dripSrc = readFileSync(join(root, 'game/assets/js/event-drip.js'), 'utf8');
assert(dripSrc.includes('shouldEscalateCodeBlue'), 'escalate helper');
assert(dripSrc.includes('acuityScore'), 'acuity score patch');
assert(dripSrc.includes('skipStep'), 'STAT skip step');

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(appSrc.includes('pack?.shiftStart'), 'pack shift window applied');

if (failures.length) {
  console.error('E7.M3 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E7.M3 AUTO PASS');
