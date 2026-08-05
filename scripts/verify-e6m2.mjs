/**
 * AUTO checks for E6.M2 performance meter + expandable debrief + ethics framing.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

globalThis.window = globalThis;
globalThis.document = {
  getElementById: () => null,
  querySelector: () => ({
    textContent: '',
    title: '',
    classList: { add() {}, remove() {} },
    offsetWidth: 0
  }),
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, appendChild() {} }),
  body: { appendChild() {}, removeChild() {} }
};

const {
  resolvePracticeOutcome,
  resolvePerformanceBand
} = await import('../game/assets/js/scoring.js');
const {
  buildDebriefReport,
  renderDebriefHtml,
  renderShortGameOverHtml
} = await import('../game/assets/js/debrief.js');

assert(existsSync(join(root, 'game/assets/js/scoring.js')), 'scoring.js');
assert(GameConfig.scoring.outcomes.steadyCharge.min === 90, 'outcome bands');
assert(GameConfig.scoring.outcomes.sharpShift.id === 'sharp-shift', 'sharp shift id');

const strong = resolvePerformanceBand({ total: 120 }, { missed: 0, late: 0 });
assert(strong.id === 'sharp-shift' && strong.result === 'won', 'sharp shift won');
const mid = resolvePracticeOutcome({ total: 95 }, { missed: 0, late: 0 });
assert(mid.id === 'steady-charge' && mid.result === 'won', 'steady charge won');
const weak = resolvePracticeOutcome({ total: 75 }, { missed: 0, late: 0 });
assert(weak.id === 'getting-by' && weak.result === 'lost', 'getting by lost');
const low = resolvePracticeOutcome({ total: 50 }, { missed: 0, late: 0 });
assert(low.id === 'off-pace' && low.result === 'lost', 'off pace lost');
const demoted = resolvePracticeOutcome({ total: 95 }, { missed: 0, late: 3 });
assert(demoted.id === 'getting-by', 'late pressure demotes one tier');
assert(/not a clinical competency/i.test(mid.framing), 'ethics framing');

const htmlShell = readFileSync(join(root, 'game/index.html'), 'utf8');
assert(!htmlShell.includes('id="shell-status-bar"'), 'status bar removed');
assert(!htmlShell.includes('id="shell-score"'), 'live score chrome removed');

gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
const report = buildDebriefReport();
assert(report.outcome?.label, 'debrief includes outcome');
assert(Array.isArray(report.byPatient), 'by-patient breakdown');
assert(typeof report.cheatsUsed === 'number', 'cheats counter');
assert(typeof report.challengeFails === 'number', 'challenge fails counter');
const shortHtml = renderShortGameOverHtml(report);
assert(/Too late/i.test(shortHtml), 'short screen too late');
assert(/Cheated/i.test(shortHtml), 'short screen cheated');
assert(/game-over-meter|Performance meter/i.test(shortHtml), 'meter present');
const html = renderDebriefHtml(report);
assert(/Practice outcome/i.test(html), 'outcome in html');
assert(/Perform challenges/i.test(html), 'challenge fail block');
assert(/By patient/i.test(html), 'patient section');
assert(/not a clinical competency assessment/i.test(html), 'ethics in debrief');

if (failures.length) {
  console.error('E6.M2 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E6.M2 AUTO PASS');
