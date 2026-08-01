/**
 * AUTO checks for Peritoneal dialysis exchange sequence challenge
 * (mid-sequence anchor → next two steps, IVPB hang pattern).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import {
  isPeritonealDialysisTask,
  gradePeritonealDialysisOrder,
  getPeritonealDialysisSequence,
  buildPeritonealDialysisRound
} from '../game/assets/js/challenges/skills/peritoneal-dialysis/challenge.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  existsSync(join(root, 'game/assets/js/challenges/skills/peritoneal-dialysis/config.js')),
  'pd config path'
);
assert(
  existsSync(join(root, 'game/assets/js/challenges/skills/peritoneal-dialysis/challenge.js')),
  'pd challenge.js'
);
assert(
  existsSync(join(root, 'game/events/scenarios/skill-peritoneal-dialysis-medsurg.json')),
  'pd skill pack'
);
assert(existsSync(join(root, 'game/events/patients/noa.html')), 'noa.html');

assert(Array.isArray(GameConfig.peritonealDialysisChallenge?.sequence), 'pd sequence config');
assert(GameConfig.peritonealDialysisChallenge.nextStepsCount === 2, 'pd nextStepsCount 2');
assert(GameConfig.peritonealDialysisChallenge.flashSpeedMinPct === 50, 'pd min preview speed 50%');

const seq = getPeritonealDialysisSequence();
assert(seq.length >= 5, `pd step count (≥5, got ${seq.length})`);
assert(isPeritonealDialysisTask({ metadata: { challenge: 'peritoneal-dialysis' } }), 'pd challenge detect');
assert(isPeritonealDialysisTask({ name: 'PD exchange (BP, prime, drain, fill)' }), 'pd name detect');
assert(
  !isPeritonealDialysisTask({
    metadata: { challenge: 'skill-mcq', skillId: 'peritoneal-dialysis' },
    name: 'Effluent clarity / exit-site check'
  }),
  'skill-mcq effluent not pd sequence'
);
assert(!isPeritonealDialysisTask({ type: 'med', name: 'Aspirin' }), 'aspirin not pd');

const labels = seq.map((s) => s.label);
assert(labels[0].toLowerCase().includes('bp') || labels[0].toLowerCase().includes('vital'), 'starts with BP/vitals');
assert(labels.some((l) => /drain/i.test(l)), 'includes drain');
assert(labels.some((l) => /fill/i.test(l)), 'includes fill');
assert(labels.some((l) => /prime|dwell/i.test(l)), 'includes prime or dwell');

const pdRound = buildPeritonealDialysisRound(() => 0.42);
assert(pdRound.anchorIndex >= 1, 'anchor not start');
assert(pdRound.anchorIndex < seq.length - 1, 'anchor not ending');
assert(pdRound.expectedNext.length === 2, 'asks for next two steps');
assert(
  pdRound.expectedNext[0] === seq[pdRound.anchorIndex + 1].label
  && pdRound.expectedNext[1] === seq[pdRound.anchorIndex + 2].label,
  'expected next matches sequence'
);
assert(pdRound.options.length > pdRound.expectedNext.length, 'options include distractors');
assert(
  gradePeritonealDialysisOrder(pdRound.expectedNext, pdRound.expectedNext).passed === true,
  'pd correct next steps pass'
);
assert(
  gradePeritonealDialysisOrder([...pdRound.expectedNext].reverse(), pdRound.expectedNext).passed === false,
  'pd wrong next steps fail'
);

const pdSrc = readFileSync(
  join(root, 'game/assets/js/challenges/skills/peritoneal-dialysis/challenge.js'),
  'utf8'
);
assert(pdSrc.includes('pd-seq-speed') && pdSrc.includes('paintNow'), 'pd preview speed + rewatch');
assert(pdSrc.includes('Some options are distractors'), 'pd distractor copy');
assert(pdSrc.includes('buildPeritonealDialysisRound'), 'pd round builder');

const gateSrc = readFileSync(join(root, 'game/assets/js/challenges/challenge-gate.js'), 'utf8');
assert(gateSrc.includes('skills/peritoneal-dialysis/challenge'), 'gate wires pd sequence');
assert(gateSrc.includes('buildPeritonealDialysisRound'), 'gate builds pd round');
assert(gateSrc.includes('pdSeqSubmit'), 'gate submit handler');

const regSrc = readFileSync(join(root, 'game/assets/js/challenges/registry.js'), 'utf8');
assert(regSrc.includes("'peritoneal-dialysis'") || regSrc.includes('peritoneal-dialysis:'), 'registry entry');

const spawnSrc = readFileSync(join(root, 'game/assets/js/challenges/test-spawn.js'), 'utf8');
assert(spawnSrc.includes("case 'peritoneal-dialysis'"), 'test-spawn stub');

const library = JSON.parse(readFileSync(join(root, 'game/events/skills/library.json'), 'utf8'));
const skill = library.skills?.find((s) => s.id === 'peritoneal-dialysis');
assert(skill, 'library skill peritoneal-dialysis');
assert(skill?.games?.includes('peritoneal-dialysis'), 'games includes peritoneal-dialysis');
assert(skill?.patients?.includes('noa'), 'patients includes noa');

const noa = readFileSync(join(root, 'game/events/patients/noa.html'), 'utf8');
assert(noa.includes('data-challenge="peritoneal-dialysis"'), 'noa has pd sequence challenge');
assert(noa.includes('data-challenge="skill-mcq"'), 'noa keeps cloudy effluent MCQ');

const mcqSrc = readFileSync(
  join(root, 'game/assets/js/challenges/skills/skill-mcq/config.js'),
  'utf8'
);
const pdBankMatch = mcqSrc.match(/'peritoneal-dialysis':\s*\{[\s\S]*?\n  \},/);
assert(pdBankMatch, 'pd skill-mcq bank still present');
assert(!/id:\s*'sequence'/.test(pdBankMatch[0]), 'sequence MCQ removed from pd bank');
assert(/id:\s*'cloudy'/.test(pdBankMatch[0]), 'cloudy MCQ retained');

if (failures.length) {
  console.error('PERITONEAL-DIALYSIS AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('PERITONEAL-DIALYSIS AUTO PASS');
