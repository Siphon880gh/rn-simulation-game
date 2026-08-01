/**
 * AUTO checks for sepsis-recognition Q4H screen + cheat guide + hour-1 bundle.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import {
  isSepsisScreenTask,
  rollSepsisScreenOutcome,
  getSepsisScreenOdds,
  buildSepsisFindings,
  buildSepsisScreenPrompt
} from '../game/assets/js/challenges/skills/sepsis-recognition/challenge.js';
import { spawnSepsisBundle } from '../game/assets/js/sepsis-system.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/challenges/skills/sepsis-recognition/challenge.js')), 'challenge.js');
assert(existsSync(join(root, 'game/assets/js/challenges/skills/sepsis-recognition/config.js')), 'config.js');
assert(existsSync(join(root, 'game/assets/js/sepsis-system.js')), 'sepsis-system.js');
assert(existsSync(join(root, 'docs/learning/SEPSIS_GUIDELINES.md')), 'cheat guide md');
assert(existsSync(join(root, 'game/events/patients/tessa.html')), 'tessa.html');
assert(existsSync(join(root, 'game/events/scenarios/skill-sepsis-recognition-medsurg.json')), 'skill pack');

const guide = readFileSync(join(root, 'docs/learning/SEPSIS_GUIDELINES.md'), 'utf8');
assert(/septic shock/i.test(guide), 'guide covers septic shock');
assert(/MODS/i.test(guide), 'guide covers MODS');
assert(/lactate/i.test(guide), 'guide covers lactate');
assert(/antibiotic/i.test(guide), 'guide covers antibiotics');

const docsSrc = readFileSync(join(root, 'game/assets/js/docs.js'), 'utf8');
assert(docsSrc.includes('SEPSIS_GUIDELINES.md'), 'docsStructure lists guide');
assert(docsSrc.includes('docsOpenMarkdown') || docsSrc.includes('openMarkdownDocument'), 'docs open helper');

const library = JSON.parse(readFileSync(join(root, 'game/events/skills/library.json'), 'utf8'));
const skill = library.skills?.find((s) => s.id === 'sepsis-recognition');
assert(skill, 'library skill sepsis-recognition');
assert(skill?.games?.includes('sepsis-screen'), 'games includes sepsis-screen');
assert(skill?.patients?.includes('tessa'), 'patients includes tessa');
assert(/Q4H|bundle|cheat/i.test(skill?.blurb || ''), 'blurb mentions Q4H/bundle/cheat');

const tessa = readFileSync(join(root, 'game/events/patients/tessa.html'), 'utf8');
assert(tessa.includes('sepsis-screen-q4h') || tessa.includes('sepsisScreenQ4h'), 'tessa care schedule attr');
assert(tessa.includes('data-skill-id="sepsis-recognition"'), 'tessa recognition task kept');

const patientsSrc = readFileSync(join(root, 'game/assets/js/patients.js'), 'utf8');
assert(patientsSrc.includes("careSchedules: ['sepsisScreenQ4h']")
  || patientsSrc.includes('careSchedules: ["sepsisScreenQ4h"]'), 'tessa careSchedules');
assert(patientsSrc.includes("skills: ['sepsis-recognition']")
  || patientsSrc.includes('skills: ["sepsis-recognition"]'), 'tessa skills tag');

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(appSrc.includes('SepsisSystemModule') || appSrc.includes('sepsis-system'), 'app wires sepsis system');
assert(appSrc.includes('initSepsisScreenDiceUi'), 'dice UI init');
assert(appSrc.includes("sepsis.init") || appSrc.includes('sepsis && sepsis.init'), 'sepsis.init');

const gateSrc = readFileSync(join(root, 'game/assets/js/challenges/challenge-gate.js'), 'utf8');
assert(gateSrc.includes('sepsis-recognition/challenge'), 'gate imports sepsis screen');
assert(gateSrc.includes('sepsisScreenPrompt') || gateSrc.includes('sepsisScreen'), 'gate sepsis session');

const regSrc = readFileSync(join(root, 'game/assets/js/challenges/registry.js'), 'utf8');
assert(regSrc.includes("id: 'sepsis-screen'") || regSrc.includes("'sepsis-screen'"), 'registry entry');

assert(GameConfig.careSchedules?.sepsisScreenQ4h?.intervalMins === 240, 'Q4H interval 240');
assert(GameConfig.careSchedules?.sepsisScreenQ4h?.challenge === 'sepsis-screen', 'care schedule challenge');
assert(Array.isArray(GameConfig.sepsisScreen?.outcomes), 'outcomes config');
assert(Array.isArray(GameConfig.sepsisScreen?.bundleTasks), 'bundle tasks config');
assert(GameConfig.sepsisScreen.bundleTasks.some((t) => /lactate/i.test(t.name)), 'bundle has lactate');
assert(GameConfig.sepsisScreen.bundleTasks.some((t) => /fluid/i.test(t.name)), 'bundle has fluids');
assert(GameConfig.sepsisScreen.bundleTasks.some((t) => /antibiotic/i.test(t.name)), 'bundle has antibiotics');

const odds = getSepsisScreenOdds();
assert(odds.length === 4, 'four screen bands');
const pctSum = odds.reduce((s, o) => s + o.percent, 0);
assert(pctSum > 99 && pctSum < 101.5, `odds ~100% (got ${pctSum})`);
assert(odds.some((o) => o.bundle), 'some outcomes spawn bundle');
assert(odds.some((o) => !o.bundle), 'clear band exists');

assert(isSepsisScreenTask({ metadata: { challenge: 'sepsis-screen' } }), 'challenge detect');
assert(isSepsisScreenTask({ metadata: { kind: 'sepsis-screen' } }), 'kind detect');
assert(isSepsisScreenTask({ name: 'Sepsis screen (Q4H)' }), 'name detect');
assert(!isSepsisScreenTask({ name: 'Turn / reposition' }), 'non-screen rejected');

const outcomes = GameConfig.sepsisScreen.outcomes;
const totalW = outcomes.reduce((s, r) => s + r.weight, 0);
const clearEnd = outcomes[0].weight / totalW;
const clear = rollSepsisScreenOutcome({ random: () => clearEnd * 0.5 });
assert(clear.id === 'clear', 'clear roll');
assert(!clear.bundle, 'clear no bundle');
assert(clear.findings?.vitals?.hr, 'clear has vitals');
assert(clear.findings?.systems?.length >= 3, 'clear systems rundown');
assert(clear.findings?.labs?.length >= 2, 'clear labs');

const sepsisStart = outcomes[0].weight / totalW;
const sepsisEnd = (outcomes[0].weight + outcomes[1].weight) / totalW;
const sepsis = rollSepsisScreenOutcome({ random: () => (sepsisStart + sepsisEnd) / 2 });
assert(sepsis.id === 'sepsis', `sepsis roll got ${sepsis.id}`);
assert(sepsis.bundle, 'sepsis bundles');

const shock = rollSepsisScreenOutcome({ outcomeId: 'septic-shock' });
assert(shock.id === 'septic-shock', 'forced septic-shock');
assert(/lactate|≥2|shock/i.test(JSON.stringify(shock.findings?.labs || [])), 'shock lactate cue');

const mods = buildSepsisFindings('mods', { random: () => 0.5 });
assert(mods.systems?.length >= 4, 'mods multi-system');
assert(mods.labs?.some((l) => /plt|bili|cr/i.test(l.name)), 'mods organ labs');

const prompt = buildSepsisScreenPrompt(
  { name: 'Sepsis screen (Q4H)', metadata: { challenge: 'sepsis-screen' } },
  { outcome: rollSepsisScreenOutcome({ outcomeId: 'sepsis', random: () => 0 }) }
);
assert(prompt?.choices?.length === 4, 'four classify choices');
assert(prompt.choices.some((c) => c.correct), 'one correct classify');
assert(/SEPSIS_GUIDELINES/i.test(prompt.guideFilename), 'guide filename on prompt');

// Bundle spawn (headless): register fake patient + complete screen outcome
gameState.dispatch('REGISTER_PATIENT', {
  patient: {
    id: 'tessa-verify',
    name: 'Tessa Verify',
    room: '295-A',
    diagnosis: 'UTI — possible sepsis',
    status: 'active'
  }
});
const screenTask = taskSystem.createTask({
  id: 'tessa-verify-sepsisScreenQ4h-1900',
  name: 'Sepsis screen (Q4H)',
  type: 'assessment',
  scheduled: 1900,
  expire: '+60',
  durationMins: 12,
  patientId: 'tessa-verify',
  status: GameConfig.tasks.statuses.ACTIVE,
  metadata: {
    kind: 'sepsis-screen',
    challenge: 'sepsis-screen',
    sepsisScreen: {
      id: 'sepsis',
      label: 'Sepsis',
      bundle: true,
      bundleTier: 'sepsis',
      classifyLabel: 'Sepsis — start hour-1 bundle'
    }
  }
});
const spawned = spawnSepsisBundle('tessa-verify', screenTask, { now: 1900, bundleTier: 'sepsis' });
assert(spawned.length >= 4, `sepsis tier spawns ≥4 (got ${spawned.length})`);
assert(spawned.some((t) => /lactate/i.test(t.name)), 'spawned lactate');
assert(spawned.some((t) => /fluid/i.test(t.name)), 'spawned fluids');
assert(spawned.some((t) => /antibiotic/i.test(t.name)), 'spawned antibiotics');
assert(spawned.some((t) => /culture/i.test(t.name)), 'spawned cultures');
assert(!spawned.some((t) => /vasopressor/i.test(t.name)), 'sepsis tier skips vasopressors');

const shockSpawned = spawnSepsisBundle('tessa-verify', {
  id: 'screen-shock',
  metadata: { sepsisScreen: { id: 'septic-shock', bundleTier: 'septic-shock', bundle: true } }
}, { now: 1915, bundleTier: 'septic-shock' });
assert(shockSpawned.some((t) => /vasopressor|repeat lactate/i.test(t.name)), 'shock extras');

const modsSpawned = spawnSepsisBundle('tessa-verify', {
  id: 'screen-mods',
  metadata: { sepsisScreen: { id: 'mods', bundleTier: 'mods', bundle: true } }
}, { now: 2000, bundleTier: 'mods' });
assert(modsSpawned.some((t) => /multi-organ|organ support/i.test(t.name)), 'mods organ huddle');

if (failures.length) {
  console.error('verify-sepsis FAILED:');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('verify-sepsis: OK');
