/**
 * AUTO: day/night shiftKind + time remapping helper.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePack } from '../game/assets/js/scenario-pack.js';
import {
    applyRequestedShiftToPack,
    convertPatientHtmlTimes,
    resolvePackShiftKind,
    resolveRequestedShiftKind,
    shiftOffsetMins
} from '../game/assets/js/shift-kind.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const nightRaw = JSON.parse(readFileSync(
    join(root, 'game/events/scenarios/medsurg-5.json'),
    'utf8'
));
assert(nightRaw.shiftKind === 'night', 'medsurg-5 shiftKind night');
const night = normalizePack(nightRaw, 'events/scenarios/medsurg-5.json');
assert(resolvePackShiftKind(night) === 'night', 'normalize night kind');

const dayRaw = JSON.parse(readFileSync(
    join(root, 'game/events/scenarios/day-shift-medsurg.json'),
    'utf8'
));
assert(dayRaw.shiftKind === 'day', 'day pack shiftKind');
const day = normalizePack(dayRaw, 'events/scenarios/day-shift-medsurg.json');
assert(resolvePackShiftKind(day) === 'day', 'normalize day kind');

assert(shiftOffsetMins('night', 'day') === 720, 'night→day offset');
assert(shiftOffsetMins('day', 'night') === -720, 'day→night offset');
assert(shiftOffsetMins('night', 'night') === 0, 'same kind offset');

const flipped = applyRequestedShiftToPack(night, 'day');
assert(flipped.shiftConverted === true, 'converted flag');
assert(flipped.shiftStart === 700, 'day start after flip');
assert(flipped.authoredShiftKind === 'night', 'authored preserved');
assert(flipped.requestedShiftKind === 'day', 'requested day');
assert(Number(flipped.events?.[0]?.at) === 800, 'event 2000→0800');
assert(Array.isArray(flipped.orderInjections?.['700']), 'orders key 1900→700');

const same = applyRequestedShiftToPack(night, 'night');
assert(same.shiftConverted === false, 'no convert when matching');
assert(Number(same.events?.[0]?.at) === 2000, 'event unchanged');

const html = '<li data-scheduled="2200" data-expire="2300"><span class="ml-auto text-sm text-gray-500">2200</span></li><li data-expire="+60" data-scheduled="1930"><span>1930</span></li>';
const htmlOut = convertPatientHtmlTimes(html, 720);
assert(htmlOut.includes('data-scheduled="1000"'), 'html scheduled +12h');
assert(htmlOut.includes('data-expire="1100"'), 'html absolute expire +12h');
assert(htmlOut.includes('data-expire="+60"'), 'relative expire kept');
assert(htmlOut.includes('data-scheduled="0730"') || htmlOut.includes('data-scheduled="730"'), '1930→0730');
assert(htmlOut.includes('>1000</span>'), 'visible label 2200→1000');
assert(htmlOut.includes('>0730</span>'), 'visible label 1930→0730');
assert(!htmlOut.includes('>2200</span>'), 'no leftover night label');

assert(
    resolveRequestedShiftKind(new URLSearchParams('shift=day'), night) === 'day',
    'URL shift=day'
);
assert(
    resolveRequestedShiftKind(new URLSearchParams('shift-starts=0700'), night) === 'day',
    'URL shift-starts day'
);

const index = readFileSync(join(root, 'index.html'), 'utf8');
assert(index.includes('census-choice-shift'), 'landing shift toggle');
assert(index.includes('data-shift="night"'), 'moon control');
assert(index.includes('data-shift="day"'), 'sun control');

const landing = readFileSync(join(root, 'assets/js/landing-census.js'), 'utf8');
assert(landing.includes("searchParams.set('shift'"), 'landing sets shift param');
assert(landing.includes('shift-starts'), 'landing sets shift-starts');

assert(existsSync(join(root, 'game/assets/js/shift-kind.js')), 'helper module');

const patientsSrc = readFileSync(join(root, 'game/assets/js/patients.js'), 'utf8');
assert(patientsSrc.includes('convertPatientHtmlTimes'), 'patients remaps HTML');

const scenarioSrc = readFileSync(join(root, 'game/assets/js/scenario-pack.js'), 'utf8');
assert(scenarioSrc.includes('applyRequestedShiftToPack'), 'pack remaps on load');

if (failures.length) {
    console.error('shift-kind AUTO FAIL');
    failures.forEach((f) => console.error(' -', f));
    process.exit(1);
}
console.log('shift-kind AUTO PASS');
