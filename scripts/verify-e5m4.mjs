/**
 * AUTO checks for E5.M4 Code Blue mini-game.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import {
  getCodeBlueSteps,
  gradeCodeBlueOrder
} from '../game/assets/js/code-blue-challenge.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/code-blue-challenge.js')), 'code-blue-challenge.js');
assert(Array.isArray(GameConfig.codeBlueChallenge?.steps), 'config steps');
const steps = getCodeBlueSteps();
assert(steps.length === 3, 'thin 3-step sequence');

const labels = steps.map((s) => s.label);
assert(gradeCodeBlueOrder(labels).passed === true, 'correct order passes');
assert(gradeCodeBlueOrder([...labels].reverse()).passed === false, 'wrong order fails');

const gateSrc = readFileSync(join(root, 'game/assets/js/challenge-gate.js'), 'utf8');
const dripSrc = readFileSync(join(root, 'game/assets/js/event-drip.js'), 'utf8');
const stateSrc = readFileSync(join(root, 'game/assets/js/game-state.js'), 'utf8');
assert(gateSrc.includes('runCodeBlueChallenge'), 'gate exports Code Blue runner');
assert(gateSrc.includes("subscribe('codeBlueHook'"), 'gate listens for escalate hook');
assert(dripSrc.includes('MARK_CODE_BLUE_HOOK'), 'drip still marks hook');
assert(dripSrc.includes('opening response challenge'), 'drip opens challenge messaging');
assert(stateSrc.includes('RESOLVE_CODE_BLUE'), 'resolve action');

if (failures.length) {
  console.error('E5.M4 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E5.M4 AUTO PASS');
