/**
 * AUTO checks for secret ?game-over= presets (testGameOver gate + band logic).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import { resolvePerformanceBand } from '../game/assets/js/scoring.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

globalThis.window = globalThis;
globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, appendChild() {} }),
  body: { appendChild() {}, removeChild() {} }
};

const {
  GAME_OVER_TEST_PRESETS,
  applyGameOverTestPreset,
  getGameOverTestPreset,
  listGameOverTestPresets
} = await import('../game/assets/js/game-over-test.js');
const { buildDebriefReport } = await import('../game/assets/js/debrief.js');

assert(existsSync(join(root, 'game/assets/js/game-over-test.js')), 'game-over-test.js');
assert(existsSync(join(root, 'assets/js/landing-game-over-test.js')), 'landing-game-over-test.js');
assert(GameConfig.urlParams.gameOver === 'game-over', 'url param key');

const cfgJson = JSON.parse(readFileSync(join(root, 'config/test.json'), 'utf8'));
assert(cfgJson.testGameOver === true, 'config/test.json testGameOver true');

const landingHtml = readFileSync(join(root, 'index.html'), 'utf8');
assert(landingHtml.includes('landing-game-over-tests'), 'homepage host');
assert(landingHtml.includes('landing-game-over-test.js'), 'homepage script');

const landingJs = readFileSync(join(root, 'assets/js/landing-game-over-test.js'), 'utf8');
assert(landingJs.includes('testGameOver'), 'landing gates on testGameOver');
assert(landingJs.includes('game-over'), 'landing builds game-over urls');
assert(landingJs.includes('host.hidden = true'), 'landing hides host when gated off');

const landingCss = readFileSync(join(root, 'assets/css/landing.css'), 'utf8');
assert(/\.landing-path\[hidden\]/.test(landingCss), 'landing-path[hidden] display none');

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(appSrc.includes('GameOverTestModule'), 'app wires game-over test');
assert(appSrc.includes('bootImmediateGameOverTest'), 'immediate game-over boot');
assert(appSrc.includes('gameOverTest'), 'app registers module');
assert(appSrc.includes('_gameOverSettled'), 'game-over once guard');
const gotSrc = readFileSync(join(root, 'game/assets/js/game-over-test.js'), 'utf8');
assert(gotSrc.includes('runImmediateGameOverTest'), 'immediate runner');
assert(!/requestAnimationFrame/.test(gotSrc), 'no paint delay before game over');

const presets = listGameOverTestPresets();
assert(presets.length >= 6, 'preset catalog size');
['perfection', 'near-perfection', 'lots-of-cheats', 'lots-of-late', 'few-late', 'no-late']
  .forEach((id) => assert(getGameOverTestPreset(id), `preset ${id}`));

gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
gameState.dispatch('REGISTER_PATIENT', {
  patient: { id: 'maria', name: 'Maria', clinicalStatus: 'stable' }
});

function expectBand(presetId, expectedId, expectedResult) {
  const seeded = applyGameOverTestPreset(presetId);
  assert(seeded?.id === presetId, `seed ${presetId}`);
  const report = buildDebriefReport();
  const band = resolvePerformanceBand(report.score, report.counts);
  assert(band.id === expectedId, `${presetId} → ${expectedId} (got ${band.id})`);
  assert(band.result === expectedResult, `${presetId} result ${expectedResult}`);
  assert(report.counts.late === GAME_OVER_TEST_PRESETS[presetId].late, `${presetId} late count`);
  assert(report.cheatsUsed === GAME_OVER_TEST_PRESETS[presetId].cheatsUsed, `${presetId} cheats`);
}

expectBand('perfection', 'sharp-shift', 'won');
expectBand('near-perfection', 'steady-charge', 'won');
expectBand('lots-of-cheats', 'steady-charge', 'won');
expectBand('lots-of-late', 'getting-by', 'lost'); // demoted from steady by ≥3 late
expectBand('few-late', 'steady-charge', 'won');
expectBand('no-late', 'steady-charge', 'won');
expectBand('getting-by', 'getting-by', 'lost');
expectBand('off-pace', 'off-pace', 'lost');

// Seeded missed-question review for presets with challengeFails
['lots-of-late', 'getting-by', 'off-pace'].forEach((id) => {
  applyGameOverTestPreset(id);
  const report = buildDebriefReport();
  const fails = GAME_OVER_TEST_PRESETS[id].challengeFails;
  assert(report.challengeFails === fails, `${id} challengeFails`);
  assert(
    Array.isArray(report.challengeMisses) && report.challengeMisses.length === fails,
    `${id} challengeMisses length ${fails}`
  );
  if (fails > 0) {
    const first = report.challengeMisses[0];
    assert(first.given && first.given !== '', `${id} miss has given`);
    assert(first.expected && first.expected !== '', `${id} miss has expected`);
  }
});

applyGameOverTestPreset('perfection');
{
  const report = buildDebriefReport();
  assert(
    Array.isArray(report.challengeMisses) && report.challengeMisses.length === 0,
    'perfection has no challengeMisses'
  );
}

const debriefSrc = readFileSync(join(root, 'game/assets/js/debrief.js'), 'utf8');
assert(debriefSrc.includes('Missed question review'), 'debrief miss review heading');
assert(debriefSrc.includes('Your answer'), 'debrief your answer');
assert(debriefSrc.includes('Correct answer'), 'debrief correct answer');
assert(debriefSrc.includes('<details'), 'perform challenges collapsed details');
assert(debriefSrc.includes('data-challenge-fail-block'), 'perform challenges block marker');
assert(debriefSrc.includes('data-miss-carousel'), 'miss review carousel');
assert(debriefSrc.includes('data-miss-carousel-action'), 'miss carousel actions');
assert(debriefSrc.includes('fa-chevron-left'), 'miss carousel left chevron');
assert(debriefSrc.includes('fa-chevron-right'), 'miss carousel right chevron');
assert(debriefSrc.includes('data-miss-carousel-dot'), 'miss carousel dots');
const gotMissSrc = readFileSync(join(root, 'game/assets/js/game-over-test.js'), 'utf8');
assert(gotMissSrc.includes('SAMPLE_CHALLENGE_MISSES'), 'sample miss catalog');
assert(gotMissSrc.includes('buildSeededChallengeMisses'), 'seed helper');
assert(gotMissSrc.includes('SAMPLE_TASK_NAMES'), 'clinical task name pool');
assert(!gotMissSrc.includes('Completed task ${'), 'no generic Completed task labels');

applyGameOverTestPreset('getting-by');
{
  const report = buildDebriefReport();
  const firstDone = report.summary.completed[0];
  assert(firstDone?.name && !/^Completed task/i.test(firstDone.name), 'seeded completed name is clinical');
  assert(firstDone?.patientId && firstDone.patientId !== 'unit', 'seeded task has patient id');
}
if (failures.length) {
  console.error('GAME-OVER TEST AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('GAME-OVER TEST AUTO PASS');
