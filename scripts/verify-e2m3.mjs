/**
 * AUTO checks for E2.M3 4–6 patient census.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const patientsSrc = readFileSync(join(root, 'game/assets/js/patients.js'), 'utf8');
const ids = ['joe', 'maria', 'derek', 'aisha', 'robert', 'lin'];

ids.forEach((id) => {
    assert(patientsSrc.includes(`id: '${id}'`), `config ${id}`);
    assert(existsSync(join(root, `game/events/patients/${id}.html`)), `html ${id}`);
    assert(existsSync(join(root, `game/events/patients/${id}-past-hx.json`)), `past hx ${id}`);
});

const configCount = (patientsSrc.match(/htmlFile:\s*'events\/patients\//g) || []).length;
assert(configCount >= 4 && configCount <= 6, `census size ${configCount} not in 4–6`);
assert(configCount === 6, `expected 6 packs for full MVP census, got ${configCount}`);
assert(patientsSrc.includes('updateCensusMeta'), 'census meta helper');
assert(patientsSrc.includes('census-count-badge'), 'census badge in tabs');

if (failures.length) {
    console.error('E2.M3 AUTO FAIL');
    failures.forEach((f) => console.error(' -', f));
    process.exit(1);
}
console.log('E2.M3 AUTO PASS');
