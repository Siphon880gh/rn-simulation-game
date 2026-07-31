/**
 * AUTO checks for E5.M2 med brand↔generic quiz (typed + multi-brand SATA).
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeAnswer,
  resolveMedPair,
  pairBrands,
  taskPresentsBrand,
  buildMedIdentityPrompt,
  checkMedIdentityAnswer,
  applyMedIdentityCheat
} from '../game/assets/js/med-identity-quiz.js';
import { medIdentityPairs } from '../game/assets/js/challenges/skills/med-identity/config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/challenges/skills/med-identity/config.js')), 'med-identity config');
assert(existsSync(join(root, 'game/assets/js/challenges/skills/med-identity/challenge.js')), 'med-identity challenge');
const gateSrc = readFileSync(join(root, 'game/assets/js/challenges/challenge-gate.js'), 'utf8');
assert(gateSrc.includes('skills/med-identity/challenge'), 'gate imports quiz');
assert(gateSrc.includes('buildMedIdentityPrompt'), 'gate uses prompt builder');
assert(gateSrc.includes('challengeGateSubmit'), 'submit wired');
assert(gateSrc.includes('challengeGateCheat'), 'cheat wired');
assert(gateSrc.includes('applyMedIdentityCheat'), 'med cheat fill');
assert(gateSrc.includes('cheatChallenge'), 'unified cheat');
assert(gateSrc.includes('readMedIdentitySataSelection'), 'gate SATA selection');
assert(gateSrc.includes("mode === 'sata'"), 'gate SATA submit branch');

assert(normalizeAnswer('  Lipitor ') === 'lipitor', 'normalize trim/case');
assert(resolveMedPair('Atorvastatin')?.generic === 'atorvastatin', 'resolve atorvastatin');
assert(pairBrands(resolveMedPair('Atorvastatin'))[0] === 'Lipitor', 'atorvastatin primary brand');
assert(resolveMedPair('Aspirin (Low-dose)')?.generic === 'aspirin', 'resolve aspirin alias');
assert(resolveMedPair('Albuterol neb')?.generic === 'albuterol', 'resolve albuterol');
assert(pairBrands(resolveMedPair('Acetaminophen')).includes('Tylenol'), 'resolve acetaminophen brands');
assert(resolveMedPair('metformin')?.generic === 'metformin', 'resolve metformin');
assert(resolveMedPair('lisinopril')?.generic === 'lisinopril', 'resolve lisinopril');
assert(resolveMedPair('Hydromorphone')?.brand === 'Dilaudid'
  || pairBrands(resolveMedPair('Hydromorphone'))[0] === 'Dilaudid', 'resolve hydromorphone');
assert(resolveMedPair('Levetiracetam IV')?.generic === 'levetiracetam', 'resolve levetiracetam');
assert(resolveMedPair('Oral vancomycin')?.generic === 'vancomycin', 'resolve vancomycin');

// Generic task name → ask brand (not random brand→generic)
const brandAsk = buildMedIdentityPrompt({ name: 'Atorvastatin', type: 'med' });
assert(brandAsk.direction === 'genericToBrand', 'generic task asks brand');
assert(brandAsk.mode === 'typed', 'single-brand typed');
assert(brandAsk.shown === 'atorvastatin', 'shows generic');
assert(checkMedIdentityAnswer('Lipitor', brandAsk), 'case-insensitive brand match');
assert(checkMedIdentityAnswer('lipitor', brandAsk), 'lowercase brand match');
assert(!checkMedIdentityAnswer('Neurontin', brandAsk), 'wrong brand rejected');
assert(!taskPresentsBrand('Atorvastatin', resolveMedPair('Atorvastatin')), 'atorvastatin is generic label');

// Multi-brand generic → SATA
const sataAsk = buildMedIdentityPrompt(
  { name: 'metformin', type: 'med' },
  { random: () => 0.42 }
);
assert(sataAsk.mode === 'sata', 'metformin multi-brand SATA');
assert(sataAsk.direction === 'genericToBrand', 'SATA still asks brand');
assert(Array.isArray(sataAsk.choices) && sataAsk.choices.length >= 4, 'SATA has choices + distractors');
assert(sataAsk.correctBrands.includes('glucophage'), 'SATA expects Glucophage');
assert(
  checkMedIdentityAnswer(['Glucophage', 'Glumetza', 'Fortamet'], sataAsk),
  'SATA all brands pass'
);
assert(
  !checkMedIdentityAnswer(['Glucophage', 'Glumetza'], sataAsk),
  'SATA incomplete rejected'
);
assert(
  !checkMedIdentityAnswer(['Glucophage', 'Glumetza', 'Fortamet', 'Lipitor'], sataAsk),
  'SATA extras rejected'
);

const albuterolSata = buildMedIdentityPrompt({ name: 'Albuterol neb', type: 'med' }, { random: () => 0.1 });
assert(albuterolSata.mode === 'sata', 'albuterol multi-brand SATA');

// Explicit brand→generic still supported (e.g. brand-labeled task)
const genericAsk = buildMedIdentityPrompt(
  { name: 'Ceftriaxone', type: 'med' },
  { direction: 'brandToGeneric' }
);
assert(genericAsk.shown === 'Rocephin', 'shows brand');
assert(checkMedIdentityAnswer('ceftriaxone', genericAsk), 'generic match');
assert(checkMedIdentityAnswer(' CEFTRIAXONE ', genericAsk), 'trim/case generic');

// Brand-presenting task name (not used much in packs) → ask generic
const brandTask = buildMedIdentityPrompt({ name: 'Lipitor', type: 'med' });
assert(brandTask.direction === 'brandToGeneric', 'brand task asks generic');
assert(brandTask.mode === 'typed', 'brand task typed');
assert(checkMedIdentityAnswer('atorvastatin', brandTask), 'brand→generic ok');

assert(typeof applyMedIdentityCheat === 'function', 'applyMedIdentityCheat export');

// Scan patient med task names: every resolvable identity med has brands
const patientsDir = join(root, 'game/events/patients');
const skipChallenge = new Set(['accucheck', 'ivpb', 'ivpb-hang', 'skill-mcq']);
const skipName = /accucheck|hypertonic saline|sliding scale/i;
const unresolved = [];
const covered = [];
for (const file of readdirSync(patientsDir).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(patientsDir, file), 'utf8');
  const re = /<li\b([^>]*)data-task-type="med"([^>]*)>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = `${m[1]}${m[2]}`;
    const ch = /data-challenge="([^"]+)"/i.exec(attrs);
    if (ch && skipChallenge.has(ch[1].toLowerCase())) continue;
    const span = /<span[^>]*font-medium[^>]*>([\s\S]*?)<\/span>/i.exec(m[3]);
    if (!span) continue;
    const name = span[1].replace(/\s+/g, ' ').trim();
    if (skipName.test(name)) continue;
    const pair = resolveMedPair(name);
    if (!pair) {
      unresolved.push(`${file}: ${name}`);
      continue;
    }
    const brands = pairBrands(pair);
    assert(brands.length >= 1, `brands for ${name}`);
    covered.push(name);
  }
}
assert(unresolved.length === 0, `all scanned meds covered (${unresolved.join('; ') || 'ok'})`);
assert(covered.length > 0, 'scanned at least one med task');
assert(medIdentityPairs.length >= 20, 'pair bank includes scanned meds');

if (failures.length) {
  console.error('E5.M2 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log(`E5.M2 AUTO PASS (${covered.length} patient med tasks covered; ${medIdentityPairs.length} pairs)`);
