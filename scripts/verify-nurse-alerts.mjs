/**
 * AUTO checks for sound toggle + nurse alerts (call light / bed alarm).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import { isSoundEnabled, setSoundEnabled, playAlarm } from '../game/assets/js/sound.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(existsSync(join(root, 'game/assets/js/sound.js')), 'sound.js');
assert(existsSync(join(root, 'game/assets/js/nurse-alerts.js')), 'nurse-alerts.js');
assert(GameConfig.sound?.storageKey, 'sound storage key');
assert(GameConfig.nurseAlerts?.callLights?.maxPerShift >= 1, 'call light max');
assert(GameConfig.nurseAlerts?.bedAlarms?.maxPerShift >= 1, 'bed alarm max');
assert(
  GameConfig.nurseAlerts.callLights.templates.some((t) => /water/i.test(t.name)),
  'water call light template'
);
assert(
  GameConfig.nurseAlerts.bedAlarms.templates.some((t) => /fall|bed/i.test(t.name)),
  'bed near-fall template'
);

const html = readFileSync(join(root, 'game/index.html'), 'utf8');
assert(html.includes('id="shell-sound-toggle"'), 'sound toggle in shell');

const appSrc = readFileSync(join(root, 'game/assets/js/app.js'), 'utf8');
assert(appSrc.includes('SoundModule') || appSrc.includes('sound.js'), 'app wires sound');
assert(appSrc.includes('NurseAlertsModule') || appSrc.includes('nurse-alerts'), 'app wires nurse alerts');

const testSrc = readFileSync(join(root, 'game/assets/js/test-mode.js'), 'utf8');
assert(testSrc.includes('spawnCallLightNow'), 'test mode call light');
assert(testSrc.includes('spawnBedAlarmNow'), 'test mode bed alarm');

setSoundEnabled(false);
assert(isSoundEnabled() === false, 'sound can mute');
assert(playAlarm('callLight') === false, 'muted play no-ops');
setSoundEnabled(true);
assert(isSoundEnabled() === true, 'sound can enable');
// No AudioContext in node — playAlarm returns false without window audio
assert(playAlarm('bed') === false, 'node has no AudioContext');

const alertSrc = readFileSync(join(root, 'game/assets/js/nurse-alerts.js'), 'utf8');
assert(alertSrc.includes("playAlarm(alarm)"), 'alerts play sound on spawn');
assert(alertSrc.includes('presentSpawnedTask'), 'alerts present task as active/selectable');
assert(alertSrc.includes('opts.patientId'), 'alerts accept patientId override');

const dynSrc = readFileSync(join(root, 'game/assets/js/dynamic-tasks.js'), 'utf8');
assert(dynSrc.includes('export function presentSpawnedTask'), 'presentSpawnedTask export');
assert(dynSrc.includes('ACTIVATE_TASK'), 'presentSpawnedTask can force-activate');

if (failures.length) {
  console.error('NURSE ALERTS AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('NURSE ALERTS AUTO PASS');
