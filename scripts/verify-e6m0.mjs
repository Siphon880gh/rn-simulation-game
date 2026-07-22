/**
 * AUTO checks for E6.M0 thin prioritization debrief.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import taskSystem from '../game/assets/js/task-system.js';

// modal.js (pulled by debrief) expects a browser global
globalThis.window = globalThis;
globalThis.document = {
  getElementById: () => null,
  querySelector: () => null,
  createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, appendChild() {} }),
  body: { appendChild() {}, removeChild() {} }
};

const { buildDebriefReport, renderDebriefHtml } = await import('../game/assets/js/debrief.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(existsSync(join(root, 'game/assets/js/debrief.js')), 'debrief.js');
assert(appSrc.includes('DebriefModule'), 'app wires debrief');
assert(appSrc.includes('showPrioritizationDebrief'), 'game over shows debrief');

gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
gameState.dispatch('APPEND_SHIFT_LOG', { message: 'Test log line', timeLabel: '19:00' });

const done = taskSystem.createTask({
  id: 'db-done', type: 'med', name: 'Done Med', scheduled: 1900, expire: '+30', durationMins: 5, patientId: 'joe'
});
taskSystem.processTasks(1900);
taskSystem.completeTask(done.id);

const late = taskSystem.createTask({
  id: 'db-late', type: 'med', name: 'Late Med', scheduled: 1900, expire: '+10', durationMins: 5, patientId: 'maria'
});
taskSystem.processTasks(1900);
taskSystem.processTasks(1911);

taskSystem.createTask({
  id: 'db-miss', type: 'med', name: 'Missed Med', scheduled: 2200, expire: '+30', durationMins: 5, patientId: 'lin'
});

const report = buildDebriefReport();
assert(report.counts.completed >= 1, 'completed count');
assert(report.counts.late >= 1, 'late count');
assert(report.counts.missed >= 1, 'missed count');
assert(report.notes.some((n) => /practice feedback/i.test(n)), 'ethics framing note');
assert(report.logLines.some((e) => /Test log line/.test(e.message)), 'includes shift log');

const html = renderDebriefHtml(report);
assert(/Completed/.test(html) && /Late/.test(html) && /Missed/.test(html), 'html sections');
assert(/Recent shift log/.test(html), 'log section');
assert(GameConfig.gameStates.GAME_OVER === 'game_over', 'game over status key');

if (failures.length) {
  console.error('E6.M0 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E6.M0 AUTO PASS');
