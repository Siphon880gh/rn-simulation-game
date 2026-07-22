/**
 * AUTO checks for test-mode JSON flag + brand Test → modal wiring.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import { isTestModeEnabled } from '../game/assets/js/test-mode.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/test-mode.js')), 'test-mode.js');
assert(existsSync(join(root, 'game/test-mode.json')), 'test-mode.json');
assert(typeof GameConfig.testMode === 'object', 'testMode config');
assert(GameConfig.testMode.configUrl === 'test-mode.json', 'configUrl');
assert(GameConfig.urlParams.testMode == null, 'no URL param for test mode');
assert(
  Array.isArray(GameConfig.testMode.incidents)
    && GameConfig.testMode.incidents.some((i) => i.kind === 'critical-lab'),
  'critical-lab incident entry'
);

const json = JSON.parse(readFileSync(join(root, 'game/test-mode.json'), 'utf8'));
assert(typeof json.enabled === 'boolean', 'json.enabled boolean');

const html = readFileSync(join(root, 'game/index.html'), 'utf8');
assert(html.includes('id="shell-test-mode"'), 'shell-test-mode host');
assert(html.includes('shell-brand-heading'), 'brand heading row');

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(appSrc.includes('TestModeModule') || appSrc.includes('test-mode'), 'app wires test mode');
assert(!appSrc.includes('?test=1'), 'app does not document URL test query');

const testSrc = readFileSync(join(root, 'game/assets/js/test-mode.js'), 'utf8');
assert(testSrc.includes('loadTestModeJson') || testSrc.includes('configUrl'), 'loads JSON');
assert(testSrc.includes('openModal') || testSrc.includes('ModalModule'), 'opens modal');
assert(!testSrc.includes('URLSearchParams'), 'no URL query enable');

const css = readFileSync(join(root, 'game/assets/css/shell.css'), 'utf8');
assert(css.includes('.shell-test-mode__btn'), 'test mode button CSS');
assert(css.includes('.shell-test-mode-modal'), 'test mode modal CSS');

const critSrc = readFileSync(join(root, 'game/assets/js/critical-labs.js'), 'utf8');
assert(critSrc.includes('spawnCriticalLabNow'), 'critical lab test spawn');

assert(isTestModeEnabled() === false, 'enabled false before init/load');

if (failures.length) {
  console.error('TEST MODE AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('TEST MODE AUTO PASS');
