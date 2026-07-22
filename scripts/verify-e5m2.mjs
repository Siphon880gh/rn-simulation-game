/**
 * AUTO checks for E5.M2 med brand↔generic typed quiz.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeAnswer,
  resolveMedPair,
  buildMedIdentityPrompt,
  checkMedIdentityAnswer
} from '../game/assets/js/med-identity-quiz.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/med-identity-quiz.js')), 'med-identity-quiz.js');
const gateSrc = readFileSync(join(root, 'game/assets/js/challenge-gate.js'), 'utf8');
assert(gateSrc.includes('med-identity-quiz'), 'gate imports quiz');
assert(gateSrc.includes('buildMedIdentityPrompt'), 'gate uses prompt builder');
assert(gateSrc.includes('challengeGateSubmit'), 'submit wired');

assert(normalizeAnswer('  Lipitor ') === 'lipitor', 'normalize trim/case');
assert(resolveMedPair('Atorvastatin')?.brand === 'Lipitor', 'resolve atorvastatin');
assert(resolveMedPair('Aspirin (Low-dose)')?.generic === 'aspirin', 'resolve aspirin alias');
assert(resolveMedPair('Albuterol neb')?.brand === 'ProAir', 'resolve albuterol');
assert(resolveMedPair('Acetaminophen')?.brand === 'Tylenol', 'resolve acetaminophen');

const brandAsk = buildMedIdentityPrompt(
  { name: 'Atorvastatin', type: 'med' },
  { direction: 'genericToBrand' }
);
assert(brandAsk.direction === 'genericToBrand', 'direction brand');
assert(brandAsk.shown === 'atorvastatin', 'shows generic');
assert(checkMedIdentityAnswer('Lipitor', brandAsk), 'case-insensitive brand match');
assert(checkMedIdentityAnswer('lipitor', brandAsk), 'lowercase brand match');
assert(!checkMedIdentityAnswer('Neurontin', brandAsk), 'wrong brand rejected');

const genericAsk = buildMedIdentityPrompt(
  { name: 'Ceftriaxone', type: 'med' },
  { direction: 'brandToGeneric' }
);
assert(genericAsk.shown === 'Rocephin', 'shows brand');
assert(checkMedIdentityAnswer('ceftriaxone', genericAsk), 'generic match');
assert(checkMedIdentityAnswer(' CEFTRIAXONE ', genericAsk), 'trim/case generic');

// Random direction still returns a valid prompt
const randomPrompt = buildMedIdentityPrompt({ name: 'Heparin', type: 'med' }, { random: () => 0.1 });
assert(randomPrompt && randomPrompt.expected, 'random prompt');

if (failures.length) {
  console.error('E5.M2 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E5.M2 AUTO PASS');
