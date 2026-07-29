/**
 * AUTO checks for E2.M2 patient tabs + panel swap.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import gameState from '../game/assets/js/game-state.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const html = readFileSync(join(root, 'game/index.html'), 'utf8');
const patientsSrc = readFileSync(join(root, 'game/assets/js/patients.js'), 'utf8');
const css = readFileSync(join(root, 'game/assets/css/patients.css'), 'utf8');

assert(html.includes('id="patient-tabs"'), 'patient tabs mount');
assert(html.includes('id="global-panel"'), 'global panel mount');
assert(GameConfig.selectors.patientTabs === '#patient-tabs', 'patientTabs selector');
assert(GameConfig.selectors.globalPanel === '#global-panel', 'globalPanel selector');
assert(existsSync(join(root, 'game/events/patients/maria.html')), 'maria pack');
assert(existsSync(join(root, 'game/events/patients/maria-past-hx.json')), 'maria past hx');
assert(patientsSrc.includes("id: 'maria'"), 'maria in patientConfigs');
assert(patientsSrc.includes('applyPanelVisibility'), 'panel visibility helper');
assert(patientsSrc.includes('showPatientPanel'), 'showPatientPanel helper');
assert(patientsSrc.includes('scrollMainPanelToTop'), 'scroll main panel to top on open');
assert(
    patientsSrc.includes('prev !== patientId') || patientsSrc.includes('already active'),
    'same-id Global→patient restore'
);
assert(patientsSrc.includes('patient-panel-host'), 'panel host class');
assert(patientsSrc.includes("subscribe('activePatientId'"), 'subscribe-driven swap');
assert(css.includes('.patient-panel-host.is-active'), 'active panel CSS');
assert(css.includes('transition: opacity'), 'CSS transition');

gameState.dispatch('SET_ACTIVE_PATIENT', { patientId: 'joe' });
assert(gameState.getStateSlice('activePatientId') === 'joe', 'active joe');
gameState.dispatch('SET_ACTIVE_PATIENT', { patientId: 'maria' });
assert(gameState.getStateSlice('activePatientId') === 'maria', 'swap to maria');

if (failures.length) {
    console.error('E2.M2 AUTO FAIL');
    failures.forEach((f) => console.error(' -', f));
    process.exit(1);
}
console.log('E2.M2 AUTO PASS');
