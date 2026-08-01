/**
 * AUTO checks for Alteplase (Cathflo) PICC occlusion skill.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import {
  isAlteplaseTask,
  getAlteplasePhase,
  rollPiccPatencyOutcome,
  rollPiccRestoreOutcome,
  getPiccPatencyOdds,
  aspirateVolumeMl,
  buildAlteplaseQuiz,
  pickAlteplaseQuestion
} from '../game/assets/js/challenges/skills/alteplase/challenge.js';
import { alteplaseChallengeConfig } from '../game/assets/js/challenges/skills/alteplase/config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/challenges/skills/alteplase/challenge.js')), 'challenge.js');
assert(existsSync(join(root, 'game/assets/js/challenges/skills/alteplase/config.js')), 'config.js');
assert(existsSync(join(root, 'game/assets/js/alteplase-system.js')), 'alteplase-system.js');
assert(existsSync(join(root, 'game/events/patients/cal.html')), 'cal.html');
assert(existsSync(join(root, 'game/events/scenarios/skill-alteplase-medsurg.json')), 'skill pack');

const library = JSON.parse(readFileSync(join(root, 'game/events/skills/library.json'), 'utf8'));
const skill = library.skills?.find((s) => s.id === 'alteplase');
assert(skill, 'library skill alteplase');
assert(skill?.games?.includes('alteplase'), 'games includes alteplase');
assert(skill?.patients?.includes('cal'), 'patients includes cal');
assert(/Cathflo|30|120|aspirat/i.test(skill?.blurb || ''), 'blurb covers dwell/aspirate/Cathflo');

const cal = readFileSync(join(root, 'game/events/patients/cal.html'), 'utf8');
assert(cal.includes('data-challenge="alteplase"'), 'cal has alteplase challenge');
assert(cal.includes('data-alteplase-phase="assess"'), 'cal assess phase');
assert(cal.includes('data-weight-kg="72"'), 'cal weight ≥10 kg');

const patientsSrc = readFileSync(join(root, 'game/assets/js/patients.js'), 'utf8');
assert(patientsSrc.includes("skills: ['alteplase']") || patientsSrc.includes('skills: ["alteplase"]'), 'cal skills tag');
assert(patientsSrc.includes('weightKg: 72'), 'cal weightKg in config');

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(appSrc.includes('AlteplaseSystemModule') || appSrc.includes('alteplase-system'), 'app wires system');
assert(appSrc.includes('performAlteplaseTask'), 'performAlteplaseTask');
assert(appSrc.includes('initAlteplaseDiceUi'), 'dice UI init');

const gateSrc = readFileSync(join(root, 'game/assets/js/challenges/challenge-gate.js'), 'utf8');
assert(gateSrc.includes('skills/alteplase/challenge'), 'gate imports alteplase');
assert(gateSrc.includes('alteplaseQuiz'), 'gate alteplase session');

const regSrc = readFileSync(join(root, 'game/assets/js/challenges/registry.js'), 'utf8');
assert(regSrc.includes("id: 'alteplase'") || regSrc.includes('alteplase:'), 'registry entry');

assert(Array.isArray(GameConfig.alteplasePicc?.patencyOutcomes), 'patency outcomes config');
const odds = getPiccPatencyOdds();
assert(odds.length === 2, 'two patency bands');
const pctSum = odds.reduce((s, o) => s + o.percent, 0);
assert(pctSum > 99 && pctSum < 101.5, `odds ~100% (got ${pctSum})`);
assert(odds.some((o) => o.clotted && Math.round(o.percent) === 25), '25% clotted');
assert(odds.some((o) => !o.clotted && Math.round(o.percent) === 75), '75% patent');

const outcomes = GameConfig.alteplasePicc.patencyOutcomes;
const totalW = outcomes.reduce((s, r) => s + r.weight, 0);
const patentEnd = outcomes[0].weight / totalW;
const patent = rollPiccPatencyOutcome({ random: () => patentEnd * 0.5 });
assert(!patent.clotted, 'patent roll');
const clotRoll = () => (outcomes[0].weight + 0.01) / totalW;
const clot = rollPiccPatencyOutcome({ random: clotRoll });
assert(clot.clotted, 'clotted roll');

assert(rollPiccRestoreOutcome('reassess-120', { random: () => 0.99 }).restored, '120 always restore at p=1');
assert(!rollPiccRestoreOutcome('reassess-30', { random: () => 0.99 }).restored, '30 can fail');
assert(rollPiccRestoreOutcome('reassess-30', { random: () => 0 }).restored, '30 can pass');

const adult = aspirateVolumeMl(72);
assert(/4 to 5/.test(adult.label), `adult aspirate ${adult.label}`);
const peds = aspirateVolumeMl(8);
assert(peds.ml === 3 && peds.under10kg, 'peds 3 mL');

assert(isAlteplaseTask({ metadata: { challenge: 'alteplase', alteplasePhase: 'assess' } }), 'isAlteplaseTask');
assert(getAlteplasePhase({ metadata: { challenge: 'alteplase' } }) === 'assess', 'default assess phase');

const cathfloQ = pickAlteplaseQuestion(
  { metadata: { challenge: 'alteplase', alteplasePhase: 'assess' } },
  {}
);
assert(cathfloQ?.id === 'cathflo', 'assess prefers Cathflo question');
assert(/Cathflo/i.test(cathfloQ.correct), 'answer Cathflo');

const quiz = buildAlteplaseQuiz(
  { name: 'Assess PICC', metadata: { challenge: 'alteplase', alteplasePhase: 'assess' } },
  { question: cathfloQ }
);
assert(quiz?.expected === 'Cathflo', 'quiz expected Cathflo');
assert(quiz.choices.some((c) => c.correct && c.label === 'Cathflo'), 'Cathflo choice marked');

const adminQ = pickAlteplaseQuestion(
  { metadata: { challenge: 'alteplase', alteplasePhase: 'admin' } },
  {}
);
assert(adminQ?.id === 'admin-method', 'admin method question');
assert(/dwell|instill/i.test(adminQ.correct), 'admin method mentions instill/dwell');

assert(
  GameConfig.criticalLabs.labs.some((l) => l.id === 'picc-alteplase'),
  'critical lab picc-alteplase'
);
const lab = GameConfig.criticalLabs.labs.find((l) => l.id === 'picc-alteplase');
assert(
  lab?.callbackEffects?.some((fx) => /alteplase|Cathflo/i.test(fx.name)),
  'callback spawns administer alteplase'
);
assert(
  lab?.callbackEffects?.[0]?.metadata?.alteplasePhase === 'admin',
  'admin phase on callback effect'
);

assert(
  /30-minute|30 min/i.test(alteplaseChallengeConfig.methodSummary)
    && /120/i.test(alteplaseChallengeConfig.methodSummary),
  'method summary has 30 and 120'
);
assert(/Cathflo/i.test(alteplaseChallengeConfig.brandName), 'brand Cathflo');

const sysSrc = readFileSync(join(root, 'game/assets/js/alteplase-system.js'), 'utf8');
assert(sysSrc.includes('spawnCriticalLabNow'), 'uses critical-lab Call MD');
assert(sysSrc.includes('PICC line clotted'), 'incident name');
assert(sysSrc.includes('Wait 30 min'), '30 min dwell task');
assert(sysSrc.includes('Wait 120 min'), '120 min dwell task');
assert(sysSrc.includes('Aspirate'), 'aspirate task');

if (failures.length) {
  console.error('verify-alteplase FAILED:');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('verify-alteplase OK');
