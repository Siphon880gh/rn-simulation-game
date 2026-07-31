/**
 * AUTO checks for accucheck / sliding-scale / finger-stick challenge + cheat fill.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isAccucheckTask,
  unitsForBloodSugar,
  buildAccucheckPrompt,
  checkAccucheckAnswer,
  normalizeAccucheckAnswer,
  rollFingerStickOutcome,
  getFingerStickOdds,
  applyFingerStickResult,
  INSULIN_TYPES,
  SLIDING_SCALE
} from '../game/assets/js/accucheck-challenge.js';
import {
  setShiftAnchor,
  isAtOrAfterInShift,
  getWindowPhase
} from '../game/assets/js/availability-windows.js';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/challenges/skills/accucheck/challenge.js')), 'accucheck challenge');
const gateFull = readFileSync(join(root, 'game/assets/js/challenges/challenge-gate.js'), 'utf8');
assert(gateFull.includes('skills/accucheck/challenge'), 'gate imports accucheck');
assert(gateFull.includes('challengeGateCheat') || gateFull.includes('cheatChallenge'), 'cheat wired');
assert(gateFull.includes('submitAccucheck'), 'submitAccucheck path');
assert(gateFull.includes('Accucheck / sliding scale / finger stick'), 'challenge title rename');

const library = readFileSync(join(root, 'game/events/skills/library.json'), 'utf8');
assert(library.includes('Accucheck / sliding scale / finger stick'), 'skills library rename');

const aisha = readFileSync(join(root, 'game/events/patients/aisha.html'), 'utf8');
assert(aisha.includes('data-challenge="accucheck"'), 'aisha has accucheck challenge attr');
assert(aisha.includes('data-scheduled="2000"'), 'achs 2000');
assert(aisha.includes('data-scheduled="0600"'), 'achs 0600');

assert(isAccucheckTask({ metadata: { challenge: 'accucheck' } }), 'metadata challenge');
assert(isAccucheckTask({ name: 'Accucheck ACHS + sliding scale' }), 'name detect');
assert(isAccucheckTask({ name: 'Finger stick glucose' }), 'finger stick name detect');
assert(!isAccucheckTask({ name: 'Aspirin' }), 'non-accucheck rejected');

assert(unitsForBloodSugar(65) === 0, 'hypo 0 units');
assert(unitsForBloodSugar(120) === 0, 'mid 0 units');
assert(unitsForBloodSugar(160) === 2, '150-179 → 2');
assert(unitsForBloodSugar(190) === 4, '180-250 → 4');
assert(unitsForBloodSugar(280) === 6, '251-399 → 6');
assert(SLIDING_SCALE.length >= 3, 'scale rows');
assert(INSULIN_TYPES.includes('regular') && INSULIN_TYPES.includes('aspart') && INSULIN_TYPES.includes('lispro'), 'insulin types');

const odds = getFingerStickOdds();
assert(odds.length === 4, 'four finger-stick bands');
assert(odds.some((o) => /normal/i.test(o.label)), 'normal band');
assert(odds.some((o) => /hypoglycemia/i.test(o.label)), 'hypo band');
assert(odds.some((o) => /hyperglycemia/i.test(o.label) && !o.criticalLab), 'hyper band');
assert(odds.some((o) => o.criticalLab), 'critical hyper band');
const pctSum = odds.reduce((s, o) => s + o.percent, 0);
assert(pctSum > 99 && pctSum < 101.5, `odds ~100% (got ${pctSum})`);

assert(GameConfig.criticalLabs.labs.some((l) => l.id === 'glucose-critical'), 'glucose critical lab');
assert(Array.isArray(GameConfig.accucheckFingerStick?.outcomes), 'finger stick config');

// Deterministic: force critical via random that picks last weighted band
const outcomes = GameConfig.accucheckFingerStick.outcomes;
const totalW = outcomes.reduce((s, r) => s + r.weight, 0);
const beforeCrit = outcomes.slice(0, -1).reduce((s, r) => s + r.weight, 0);
const critRoll = () => (beforeCrit + 0.01) / totalW;
const crit = rollFingerStickOutcome({ random: critRoll });
assert(crit.criticalLab, 'critical roll flagged');
assert(crit.bloodSugar >= 400, `critical BS ${crit.bloodSugar}`);

const normalBand = outcomes.find((o) => o.id === 'normal');
const normalEnd = normalBand.weight / totalW;
const normal = rollFingerStickOutcome({ random: () => normalEnd * 0.5 });
assert(!normal.criticalLab, 'normal not critical');
assert(normal.bloodSugar >= 70 && normal.bloodSugar <= 140, `normal BS ${normal.bloodSugar}`);
assert(/normal/i.test(normal.toastTitle), 'normal toast title');

const prompt = buildAccucheckPrompt(
  { name: 'Accucheck ACHS', metadata: { challenge: 'accucheck' } },
  { bloodSugar: 175, insulin: 'aspart', random: () => 0 }
);
assert(prompt.bloodSugar === 175, 'fixed BS');
assert(prompt.insulin === 'aspart', 'fixed insulin');
assert(prompt.expected === '2', 'expected units');
assert(checkAccucheckAnswer('2', prompt), 'answer 2');
assert(checkAccucheckAnswer('2 units', prompt), 'answer 2 units');
assert(checkAccucheckAnswer('2 U', prompt), 'answer 2 U');
assert(!checkAccucheckAnswer('4', prompt), 'wrong units rejected');
assert(normalizeAccucheckAnswer('  2 Units ') === '2', 'normalize');

const fromStick = buildAccucheckPrompt(
  {
    name: 'Accucheck',
    metadata: { challenge: 'accucheck', fingerStickBg: 160 }
  },
  { insulin: 'lispro' }
);
assert(fromStick.bloodSugar === 160, 'uses fingerStickBg');
assert(fromStick.expected === '2', 'units from finger stick BS');

// Legacy random BS stays in 60–200 when no finger-stick meta
for (let i = 0; i < 40; i++) {
  const p = buildAccucheckPrompt(
    { name: 'Glucometer check', metadata: { challenge: 'accucheck' } },
    { random: () => (i + 0.5) / 40 }
  );
  assert(p.bloodSugar >= 60 && p.bloodSugar <= 200, `BS range ${p.bloodSugar}`);
  assert(INSULIN_TYPES.includes(p.insulin), `insulin ${p.insulin}`);
  assert(checkAccucheckAnswer(String(p.units), p), `self-check ${p.units}`);
}

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(appSrc.includes('applyFingerStickResult'), 'app applies finger stick');
assert(appSrc.includes('initFingerStickDiceUi'), 'app inits dice UI');
assert(appSrc.includes('fingerStickOdds'), 'context menu odds item');

const patientsSrc = readFileSync(join(root, 'game/assets/js/patients.js'), 'utf8');
assert(patientsSrc.includes('data-challenge'), 'patients extract challenge');

const critSrc = readFileSync(join(root, 'game/assets/js/critical-labs.js'), 'utf8');
assert(critSrc.includes('showShellToast'), 'generic shell toast');

// ACHS 0600 must stay inactive during evening on night shift
setShiftAnchor(1900);
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
const morning = taskSystem.createTask({
  id: 'accucheck-0600',
  type: 'med',
  name: 'Accucheck ACHS + sliding scale',
  scheduled: 600,
  expire: 700,
  durationMins: 10,
  metadata: { challenge: 'accucheck' },
  patientId: 'aisha'
});
assert(!isAtOrAfterInShift(2000, 600), '2000 before 0600 in shift');
assert(isAtOrAfterInShift(600, 600), '0600 at scheduled');
assert(getWindowPhase(morning, 2000) === 'before', '0600 window before at 2000');
taskSystem.processTasks(2000);
assert(
  gameState.getStateSlice('tasks').get('accucheck-0600').status === GameConfig.tasks.statuses.NOT_YET,
  '0600 not activated at 2000'
);
taskSystem.processTasks(600);
assert(
  gameState.getStateSlice('tasks').get('accucheck-0600').status === GameConfig.tasks.statuses.ACTIVE,
  '0600 activates at 0600'
);

// applyFingerStickResult stores meta (toast/DOM skipped safely in node)
gameState.dispatch('REGISTER_PATIENT', {
  patient: { id: 'aisha', name: 'Aisha', room: '1' }
});
const stickTask = taskSystem.createTask({
  id: 'accucheck-stick-test',
  type: 'med',
  name: 'Accucheck finger stick',
  scheduled: 1900,
  expire: 2000,
  durationMins: 10,
  metadata: { challenge: 'accucheck' },
  patientId: 'aisha'
});
const applied = applyFingerStickResult(stickTask, {
  outcome: {
    id: 'normal',
    label: 'Normal blood glucose',
    bloodSugar: 112,
    criticalLab: false,
    toastTitle: 'Accucheck normal',
    toastDetail: '112 mg/dL'
  }
});
assert(applied.skipSlidingScale === false, 'normal does not skip scale');
assert(
  gameState.getStateSlice('tasks').get('accucheck-stick-test').metadata.fingerStickBg === 112,
  'stores fingerStickBg'
);

const appliedCrit = applyFingerStickResult(
  {
    id: 'accucheck-crit-temp',
    patientId: 'aisha',
    metadata: { challenge: 'accucheck' }
  },
  {
    outcome: {
      id: 'hyperglycemia-critical',
      label: 'Hyperglycemia — critical lab',
      bloodSugar: 512,
      criticalLab: true,
      labId: 'glucose-critical',
      toastTitle: 'Accucheck — critical high',
      toastDetail: '512 mg/dL'
    }
  }
);
assert(appliedCrit.skipSlidingScale === true, 'critical skips sliding scale');
assert(appliedCrit.criticalTask, 'spawns critical lab task');
assert(
  appliedCrit.criticalTask.metadata?.labId === 'glucose-critical'
    || /512/.test(appliedCrit.criticalTask.metadata?.labResult || ''),
  'critical lab carries glucose'
);

if (failures.length) {
  console.error('ACCUCHECK AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('ACCUCHECK AUTO PASS');
