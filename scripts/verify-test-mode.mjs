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
assert(existsSync(join(root, 'config/test.json')), 'config/test.json');
assert(typeof GameConfig.testMode === 'object', 'testMode config');
assert(GameConfig.testMode.configUrl === '../config/test.json', 'configUrl');
assert(GameConfig.urlParams.testMode == null, 'no URL param for test mode');
assert(
  Array.isArray(GameConfig.testMode.incidents)
    && GameConfig.testMode.incidents.some((i) => i.kind === 'critical-lab'),
  'critical-lab incident entry'
);
assert(
  GameConfig.testMode.incidents.some((i) => i.kind === 'code-blue' && i.group === 'Emergencies'),
  'code-blue under Emergencies'
);
assert(
  GameConfig.testMode.incidents.some((i) => i.kind === 'ivpb-hang' && i.group === 'Skills'),
  'ivpb-hang under Skills'
);
assert(
  GameConfig.testMode.incidents.some((i) => i.kind === 'iv-replace' && i.group === 'Skills'),
  'iv-replace under Skills'
);
assert(
  GameConfig.testMode.incidents.some((i) => i.kind === 'med-identity' && i.group === 'Skills'),
  'med-identity under Skills'
);
assert(
  GameConfig.testMode.incidents.some((i) => i.kind === 'bed-prep' && i.group === 'Skills'),
  'bed-prep under Skills'
);
assert(
  GameConfig.testMode.incidents.some((i) => i.kind === 'accucheck' && i.group === 'Skills'),
  'accucheck under Skills'
);
assert(
  GameConfig.testMode.incidents.some((i) => i.kind === 'iv-check' && i.group === 'Skills'),
  'iv-check under Skills'
);
assert(
  GameConfig.testMode.incidents.some((i) => i.kind === 'heparin-ptt' && i.group === 'Skills'),
  'heparin-ptt under Skills'
);
assert(
  GameConfig.testMode.incidents.some((i) => i.kind === 'admission-allergies' && i.group === 'Skills'),
  'admission quiz under Skills'
);
assert(
  GameConfig.testMode.incidents.filter((i) => i.group === 'Skills').length >= 8,
  'Skills group has multiple challenge spawns'
);
assert(
  GameConfig.testMode.incidents.every((i) => typeof i.group === 'string' && i.group.length),
  'each incident has a group heading'
);
assert(
  !GameConfig.testMode.incidents.some((i) => i.group === 'Challenges'),
  'no legacy Challenges group'
);
assert(
  new Set(GameConfig.testMode.incidents.map((i) => i.group)).size >= 2,
  'at least two spawn groups'
);

const json = JSON.parse(readFileSync(join(root, 'config/test.json'), 'utf8'));
assert(typeof json.testIncidents === 'boolean', 'json.testIncidents boolean');

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
assert(testSrc.includes('fireCodeBlue') && testSrc.includes('runCodeBlueChallenge'), 'Code Blue spawn');
assert(testSrc.includes('fireChallengeSpawn') && testSrc.includes('runChallengeGate'), 'challenge spawn helper');
assert(testSrc.includes('buildTestChallengeTask'), 'uses challenges/test-spawn tasks');
assert(existsSync(join(root, 'game/assets/js/challenges/test-spawn.js')), 'test-spawn.js');
assert(testSrc.includes('shell-test-mode__scroll-hint'), 'scroll hint markup');
assert(testSrc.includes('bindScrollHint'), 'scroll hint wiring');
assert(testSrc.includes('resolveTestPatientId'), 'prefers active patient for spawns');
assert(testSrc.includes('presentSpawnedTask'), 'presents spawned tasks as active');
assert(testSrc.includes('focusPatient: true'), 'focuses patient after test spawn');
assert(testSrc.includes('is-collapsed') && testSrc.includes('bindGroupToggles'), 'collapsible spawn groups');

const css = readFileSync(join(root, 'game/assets/css/shell.css'), 'utf8');
assert(css.includes('.shell-test-mode__btn'), 'test mode button CSS');
assert(css.includes('.shell-test-mode-modal'), 'test mode modal CSS');
assert(css.includes('shell-test-mode__scroll-hint'), 'scroll hint CSS');
assert(css.includes('is-scrollable'), 'scrollable fade CSS');
assert(css.includes('.shell-test-mode__group.is-collapsed'), 'collapsed group CSS');

const critSrc = readFileSync(join(root, 'game/assets/js/critical-labs.js'), 'utf8');
assert(critSrc.includes('spawnCriticalLabNow'), 'critical lab test spawn');

assert(isTestModeEnabled() === false, 'testIncidents false before init/load');

if (failures.length) {
  console.error('TEST MODE AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('TEST MODE AUTO PASS');
