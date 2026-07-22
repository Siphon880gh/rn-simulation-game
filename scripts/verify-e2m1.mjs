/**
 * AUTO checks for E2.M1 single-patient panels + past hx (TimelineJS).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    pastHxToTimelineJs,
    parseIsoDateParts
} from '../game/assets/js/past-hx-timeline.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const html = readFileSync(join(root, 'game/index.html'), 'utf8');
const joeHtml = readFileSync(join(root, 'game/events/patients/joe.html'), 'utf8');
const patientsSrc = readFileSync(join(root, 'game/assets/js/patients.js'), 'utf8');
const state = JSON.parse(readFileSync(join(root, '.agents/state.json'), 'utf8'));
const pack = JSON.parse(readFileSync(join(root, 'game/events/patients/joe-past-hx.json'), 'utf8'));

assert(state.decisions.timeline_library === 'timelinejs', 'timelinejs stamped');
assert(html.includes('timeline3') && html.includes('timeline-min.js'), 'TimelineJS CDN');
assert(html.includes('timeline.css'), 'TimelineJS CSS');
assert(existsSync(join(root, 'game/assets/js/past-hx-timeline.js')), 'adapter module');
assert(joeHtml.includes('data-past-hx-mount') || joeHtml.includes('past-hx-timeline'), 'past hx mount in joe');
assert(joeHtml.includes('Chart history (past hx)'), 'past hx section label');
assert(patientsSrc.includes('pastHxFile'), 'patient config pastHxFile');
assert(patientsSrc.includes('ensurePastHxTimeline'), 'lazy timeline init wired');
assert(patientsSrc.includes('SET_ACTIVE_PATIENT'), 'active patient dispatch');
assert(Array.isArray(pack.pastHx) && pack.pastHx.length >= 3, 'pack has pastHx events');

const parts = parseIsoDateParts('2026-07-21');
assert(parts.year === 2026 && parts.month === 7 && parts.day === 21, 'ISO date parse');

const tl = pastHxToTimelineJs(pack);
assert(tl.events.length === pack.pastHx.length, 'events mapped');
assert(tl.events[0].text.headline === pack.pastHx[0].headline, 'headline mapped');
assert(tl.title.text.headline.includes('chart history'), 'title present');

if (failures.length) {
    console.error('E2.M1 AUTO FAIL');
    failures.forEach((f) => console.error(' -', f));
    process.exit(1);
}
console.log('E2.M1 AUTO PASS');
