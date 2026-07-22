/**
 * AUTO checks for E6.M2 final practice outcome + live cues + ethics framing.
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

const { resolvePracticeOutcome } = await import('../game/assets/js/scoring.js');
const { buildDebriefReport, renderDebriefHtml } = await import('../game/assets/js/debrief.js');

assert(existsSync(join(root, 'game/assets/js/scoring.js')), 'scoring.js');
assert(GameConfig.scoring.outcomes.pass.min === 90, 'outcome bands');
const shellCss = readFileSync(join(root, 'game/assets/css/shell.css'), 'utf8');
assert(shellCss.includes('score-cue-up'), 'live score cue CSS');

const strong = resolvePracticeOutcome({ total: 120 }, { missed: 0, late: 0 });
assert(strong.id === 'strong-pacing', 'strong band');
const mid = resolvePracticeOutcome({ total: 95 }, { missed: 0, late: 0 });
assert(mid.id === 'on-track', 'pass band');
const weak = resolvePracticeOutcome({ total: 75 }, { missed: 0, late: 0 });
assert(weak.id === 'needs-practice', 'needs practice');
const risk = resolvePracticeOutcome({ total: 95 }, { missed: 4, late: 0 });
assert(risk.id === 'overtime-risk', 'miss pressure → overtime framing');
assert(/not a clinical competency/i.test(mid.framing), 'ethics framing');

gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
const report = buildDebriefReport();
assert(report.outcome?.label, 'debrief includes outcome');
assert(Array.isArray(report.byPatient), 'by-patient breakdown');
const html = renderDebriefHtml(report);
assert(/Practice outcome/i.test(html), 'outcome in html');
assert(/By patient/i.test(html), 'patient section');
assert(/not a clinical competency assessment/i.test(html), 'ethics in debrief');

if (failures.length) {
  console.error('E6.M2 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E6.M2 AUTO PASS');
