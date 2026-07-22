/**
 * AUTO checks for E3.M5 dynamic/urgent task spawn.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';
import {
  processDynamicTasksTime,
  spawnFromTemplate,
  weightedPick,
  resetDynamicTasks
} from '../game/assets/js/dynamic-tasks.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const incidentTabs = {
  children: [],
  querySelector: () => null,
  appendChild(el) { this.children.push(el); return el; }
};

globalThis.document = {
  querySelector(sel) {
    if (sel === '#incident-tabs') return incidentTabs;
    if (sel === GameConfig.selectors.leftMenu) return { appendChild() {} };
    if (sel === GameConfig.selectors.statusMessage) return { textContent: '' };
    if (String(sel).startsWith('[data-patient-id')) {
      return {
        querySelector: () => null,
        querySelectorAll: () => [],
        appendChild() {}
      };
    }
    return null;
  },
  getElementById: () => null,
  createElement: () => ({
    className: '',
    innerHTML: '',
    style: {},
    type: 'button',
    textContent: '',
    disabled: false,
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {},
    addEventListener() {},
    appendChild() {},
    querySelector: () => null
  })
};

assert(existsSync(join(root, 'game/assets/js/dynamic-tasks.js')), 'dynamic-tasks.js');
assert(GameConfig.dynamicTasks.templates.length >= 2, 'config templates');
assert(GameConfig.dynamicTasks.cadenceGameMinutes === 60, 'cadence');

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
const html = readFileSync(join(root, 'game/index.html'), 'utf8');
assert(appSrc.includes('DynamicTasksModule'), 'app wires dynamic tasks');
assert(html.includes('id="incident-tabs"'), 'incident tabs mount');
assert(!/incident-tabs[\s\S]{0,200}clock/i.test(html), 'no clock in incident chrome label');

const pick = weightedPick([
  { id: 'a', weight: 0 },
  { id: 'b', weight: 5 }
], () => 0.1);
assert(pick.id === 'b', 'weighted pick');

resetDynamicTasks();
gameState.dispatch('INITIALIZE_GAME', { startTime: 1900 });
gameState.dispatch('REGISTER_PATIENT', {
  patient: { id: 'joe', name: 'Joe', room: '201-A', clinicalStatus: 'stable' }
});
gameState.dispatch('REGISTER_PATIENT', {
  patient: { id: 'maria', name: 'Maria', room: '204-B', clinicalStatus: 'stable' }
});

// No spawn before first cadence boundary
assert(processDynamicTasksTime(1930) == null, 'no spawn before cadence');

const spawned = processDynamicTasksTime(2000, { random: () => 0.01 });
assert(spawned, 'spawn at cadence hour');
assert(spawned.metadata?.dynamic === true, 'dynamic metadata');
assert(spawned.metadata?.incident === true, 'incident metadata');
assert(spawned.patientId === 'joe' || spawned.patientId === 'maria', 'patient scoped');

const tab = incidentTabs.children[0];
assert(tab, 'incident tab created');
assert(!/\d{2}:\d{2}/.test(tab.textContent || ''), 'incident tab omits clock time');
assert(!/\b\d{4}\b/.test(tab.textContent || ''), 'incident tab omits HHMM');

// Cap: same cadence bucket does not double-spawn
assert(processDynamicTasksTime(2015) == null, 'no double spawn same cadence');

const direct = spawnFromTemplate(GameConfig.dynamicTasks.templates[0], 2100, { random: () => 0 });
assert(direct && direct.name === 'Call light', 'direct template spawn');

if (failures.length) {
  console.error('E3.M5 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E3.M5 AUTO PASS');
