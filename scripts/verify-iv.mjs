/**
 * AUTO checks for IV / drip module (fluids, IVPB, titrations, Heparin PTT).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import {
  isIvTask,
  heparinNewRate,
  pressorNewRate,
  buildIvPrompt,
  checkIvAnswer
} from '../game/assets/js/iv-challenge.js';
import { _addMinutesToHhmm } from '../game/assets/js/iv-system.js';
import { setShiftAnchor, isAtOrAfterInShift } from '../game/assets/js/availability-windows.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/iv-system.js')), 'iv-system.js');
assert(existsSync(join(root, 'game/assets/js/challenges/skills/iv-check/challenge.js')), 'iv-check challenge');
assert(GameConfig.tasks.types.IV, 'IV task type');
assert(GameConfig.iv.heparinPttIntervalMins === 360, '6h PTT interval');
assert(Array.isArray(GameConfig.iv.titrationIncidents), 'titration incidents');

const gateSrc = readFileSync(join(root, 'game/assets/js/challenges/challenge-gate.js'), 'utf8');
const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(gateSrc.includes('skills/iv-check/challenge'), 'gate imports iv challenge');
assert(gateSrc.includes('buildIvPrompt'), 'gate builds IV prompt');
assert(appSrc.includes('IvSystemModule') || appSrc.includes('iv-system'), 'app wires IV');
assert(appSrc.includes('performIvTask'), 'performIvTask');

assert(isIvTask({ type: 'iv' }), 'iv type');
assert(isIvTask({ metadata: { challenge: 'heparin-ptt' } }), 'heparin challenge');
assert(heparinNewRate(12, 'low') === 14, 'PTT low → +2');
assert(heparinNewRate(12, 'therapeutic') === 12, 'PTT ok → same');
assert(heparinNewRate(12, 'high') === 10, 'PTT high → -2');
assert(pressorNewRate(8, 'increase') === 10, 'pressor up');
assert(pressorNewRate(8, 'decrease') === 6, 'pressor down');

const pttPrompt = buildIvPrompt({
  type: 'iv',
  name: 'Heparin PTT',
  metadata: {
    challenge: 'heparin-ptt',
    currentRate: 12,
    unit: 'units/kg/hr',
    pttResult: 'low'
  }
});
assert(pttPrompt.expected === '14', 'prompt expects 14');
assert(checkIvAnswer('14', pttPrompt), 'answer 14');
assert(!checkIvAnswer('12', pttPrompt), 'wrong rate rejected');

const checkPrompt = buildIvPrompt({
  type: 'iv',
  metadata: { challenge: 'iv-check', drug: 'insulin', currentRate: 5, unit: 'units/hr' }
});
assert(checkPrompt.expected === '5', 'iv-check rate');
assert(checkIvAnswer('5', checkPrompt), 'iv-check answer');

assert(_addMinutesToHhmm(1900, 360) === 100, '1900+6h → 0100');

setShiftAnchor(1900);
assert(!isAtOrAfterInShift(2000, 100), '0100 not yet at 2000');
assert(isAtOrAfterInShift(100, 100), '0100 at due');

const aisha = readFileSync(join(root, 'game/events/patients/aisha.html'), 'utf8');
const joe = readFileSync(join(root, 'game/events/patients/joe.html'), 'utf8');
const maria = readFileSync(join(root, 'game/events/patients/maria.html'), 'utf8');
assert(aisha.includes('data-iv-panel') && aisha.includes('Insulin drip (regular)'), 'aisha IV + insulin clarity');
assert(aisha.includes('data-challenge="iv-check"'), 'aisha insulin rate check task');
assert(joe.includes('heparin-ptt') && joe.includes('data-iv-next-ptt="0100"'), 'joe heparin PTT');
assert(maria.includes('levophed') && maria.includes('neosynephrine'), 'maria pressors');
assert(joe.includes('data-iv-kind="fluid"') && joe.includes('data-iv-kind="ivpb"'), 'joe fluid+ivpb');

if (failures.length) {
  console.error('IV AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('IV AUTO PASS');
