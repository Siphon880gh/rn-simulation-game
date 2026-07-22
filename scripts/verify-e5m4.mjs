/**
 * AUTO checks for E5.M4 Code Blue mini-game (random questions + Random swap).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import {
  getCodeBlueSteps,
  getCodeBlueQuestions,
  gradeCodeBlueOrder,
  gradeCodeBlueChoice,
  pickCodeBlueQuestion
} from '../game/assets/js/code-blue-challenge.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/code-blue-challenge.js')), 'code-blue-challenge.js');
assert(Array.isArray(GameConfig.codeBlueChallenge?.steps), 'config steps');
assert(Array.isArray(GameConfig.codeBlueChallenge?.questions), 'config questions');
const questions = getCodeBlueQuestions();
assert(questions.length >= 3, 'question pool size');
assert(questions.some((q) => q.type === 'choice'), 'has choice questions');
assert(questions.some((q) => q.type === 'order'), 'keeps order question in pool');

const steps = getCodeBlueSteps();
assert(steps.length === 3, 'thin 3-step sequence');
const labels = steps.map((s) => s.label);
assert(gradeCodeBlueOrder(labels).passed === true, 'correct order passes');
assert(gradeCodeBlueOrder([...labels].reverse()).passed === false, 'wrong order fails');

const choiceQ = questions.find((q) => q.type === 'choice' && q.id === 'compression-rate');
assert(choiceQ, 'compression-rate question');
assert(gradeCodeBlueChoice('100–120/min', choiceQ).passed === true, 'choice correct');
assert(gradeCodeBlueChoice('60–80/min', choiceQ).passed === false, 'choice wrong');

const a = pickCodeBlueQuestion({ random: () => 0 });
const b = pickCodeBlueQuestion({ excludeId: a.id, random: () => 0.99 });
assert(a && a.id, 'pick question');
assert(b && b.id, 'pick alternate');
if (questions.length > 1) {
  assert(a.id !== b.id || questions.filter((q) => q.id !== a.id).length === 0, 'exclude prefers different id');
}

const src = readFileSync(join(root, 'game/assets/js/code-blue-challenge.js'), 'utf8');
assert(src.includes('codeBlueRandom'), 'Random handler');
assert(src.includes('pickCodeBlueQuestion'), 'picker export');

const gateSrc = readFileSync(join(root, 'game/assets/js/challenge-gate.js'), 'utf8');
const dripSrc = readFileSync(join(root, 'game/assets/js/event-drip.js'), 'utf8');
const stateSrc = readFileSync(join(root, 'game/assets/js/game-state.js'), 'utf8');
assert(gateSrc.includes('runCodeBlueChallenge'), 'gate exports Code Blue runner');
assert(gateSrc.includes('challengeGateCheat'), 'cheat on Code Blue modal');
assert(gateSrc.includes('showRandom: true') || gateSrc.includes('codeBlueRandom'), 'Random in footer');
assert(src.includes('codeBlueCheat'), 'codeBlueCheat');
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
