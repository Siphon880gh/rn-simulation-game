/**
 * AUTO checks for E7.M2 chaos / incident content packs.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameConfig } from '../game/assets/js/game-config.js';
import {
  normalizePack,
  mergeIncidentPack
} from '../game/assets/js/scenario-pack.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const incidentPath = join(root, 'game/events/incidents/chaos-night-medsurg.json');
assert(existsSync(incidentPath), 'chaos incident pack file');
const incident = JSON.parse(readFileSync(incidentPath, 'utf8'));
assert(incident.dynamicTemplates?.length >= 3, 'chaos templates');
assert(incident.events?.length >= 1, 'chaos events');

assert(GameConfig.scenario.defaultIncidentPackUrl, 'default incident URL');

const base = normalizePack({
  id: 't',
  patients: ['joe'],
  events: [{ id: 'keep-me', at: 1900, message: 'x' }],
  dynamicTemplates: [{ id: 'call-light', weight: 1, name: 'Call light' }]
}, 'test');
assert(base.scene === null || base.scene === undefined || typeof base.scene === 'object', 'scene field');

const merged = mergeIncidentPack(base, incident);
assert(merged.events.some((e) => e.id === 'keep-me'), 'keeps base events');
assert(merged.events.some((e) => e.id === 'chaos-power-glitch-2045'), 'adds chaos events');
assert(merged.dynamicTemplates.some((t) => t.id === 'telemetry-alarm'), 'adds chaos templates');
assert(merged.dynamicTemplates.filter((t) => t.id === 'call-light').length === 1, 'no dup templates');

const pack = JSON.parse(readFileSync(join(root, 'game/events/scenarios/night-shift-default.json'), 'utf8'));
assert(pack.incidentPackUrl, 'scenario links incident pack');
assert(pack.scene?.theme, 'scenario keeps scene');

const src = readFileSync(join(root, 'game/assets/js/scenario-pack.js'), 'utf8');
assert(src.includes('mergeIncidentPack'), 'loader merges');
assert(src.includes('scene:'), 'normalize keeps scene');

if (failures.length) {
  console.error('E7.M2 AUTO FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('E7.M2 AUTO PASS');
