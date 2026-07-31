/**
 * AUTO verify E13 — Delegate rail (ICU CCT / staggered floor CNAs) + team/solo modes.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fail = (msg) => {
    console.error('FAIL:', msg);
    process.exit(1);
};

const gameConfigUrl = pathToFileURL(path.join(root, 'game/assets/js/game-config.js')).href;
const delegationUrl = pathToFileURL(path.join(root, 'game/assets/js/delegation.js')).href;
const classUrl = pathToFileURL(path.join(root, 'game/assets/js/task-class-interactions.js')).href;

const { GameConfig } = await import(gameConfigUrl);
const {
    buildDelegationState,
    assignStaggeredThirds,
    isAideAvailable,
    formatAideLabel,
    withTeamAssist,
    isTurnCareTask,
    isCallLightTask,
    getDelegateMode,
    canAidePerformTask
} = await import(delegationUrl);
const { resolveEffectiveDuration, resetClassInteractions } = await import(classUrl);

const cfg = GameConfig.delegation;
if (!cfg?.icu || !cfg?.floor) fail('GameConfig.delegation missing icu/floor');
if (!cfg.modes?.team || !cfg.modes?.solo) fail('delegation modes team/solo required');
if (cfg.modes.team.effect !== 'half') fail('team effect should be half');
if (cfg.modes.solo.effect !== 'instant') fail('solo effect should be instant');
if (cfg.floor.staggerThirds !== true) fail('staggerThirds should be true');

function seqRandom(values) {
    let i = 0;
    return () => {
        const v = values[i % values.length];
        i += 1;
        return v;
    };
}

function spanMins(from, until) {
    const a = Math.floor(Number(from) / 100) * 60 + (Number(from) % 100);
    const b = Math.floor(Number(until) / 100) * 60 + (Number(until) % 100);
    let d = b - a;
    if (d < 0) d += 1440;
    return d;
}

const thirds = assignStaggeredThirds(2, 1900, 720, seqRandom([0.1, 0.9, 0.2]));
if (thirds.length !== 2) fail('two thirds');
if (thirds[0].thirdIndex === thirds[1].thirdIndex) fail('CNA thirds must differ');
if (spanMins(thirds[0].availableFrom, thirds[0].availableUntil) !== 240) fail('third span');

const floor = buildDelegationState({
    pack: { department: 'medsurg', shiftStart: 1900, shiftDurationHours: 12 },
    patientIds: ['joe', 'maria', 'derek', 'aisha', 'lin'],
    shiftStart: 1900,
    shiftMins: 720,
    random: seqRandom([0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7])
});
if (floor.aides.length !== 2) fail('floor should have 2 CNAs');
if (floor.aides[0].thirdIndex === floor.aides[1].thirdIndex) fail('built aides share a third');
// Windows must not overlap (distinct thirds)
const a0 = floor.aides[0];
const a1 = floor.aides[1];
const overlap = isAideAvailable(a0, a1.availableFrom) && isAideAvailable(a1, a0.availableFrom)
    && a0.availableFrom === a1.availableFrom;
if (overlap) fail('CNA windows should not share the same third start');
if (isAideAvailable(a0, a1.availableFrom) && a0.thirdIndex !== a1.thirdIndex) {
    // a1 start should not be inside a0 window
    if (isAideAvailable(a0, a1.availableFrom)) {
        // only fail if a1's start is strictly inside a0's open interval
        const start = Number(a1.availableFrom);
        if (isAideAvailable(a0, start) && start !== Number(a0.availableUntil)) {
            // adjacent thirds: a1.start == a0.until is OK (half-open). Inside is bad.
            const a0Start = Number(a0.availableFrom);
            const a0End = Number(a0.availableUntil);
            const s = start;
            const toM = (hhmm) => Math.floor(hhmm / 100) * 60 + (hhmm % 100);
            if (toM(s) > toM(a0Start) && toM(s) < toM(a0End)) fail('CNA windows overlap');
        }
    }
}

const icu = buildDelegationState({
    pack: { department: 'icu' },
    patientIds: ['maria', 'robert'],
    shiftStart: 1900,
    shiftMins: 720,
    random: seqRandom([0.1, 0.9, 0.2, 0.8, 0.3, 0.7, 0.4, 0.6, 0.15, 0.85, 0.25, 0.75])
});
if (icu.aides[0].role !== 'cct') fail('ICU CCT');

const turnTask = {
    id: 't1',
    name: 'Turn / reposition (Q2H)',
    duration: 10,
    taskClass: 'routine',
    patientId: 'joe',
    type: 'assessment',
    status: 'active',
    metadata: { careSchedule: 'turnQ2h' }
};
const soloTask = {
    id: 't2',
    name: 'Linen change / hygiene assist',
    duration: 10,
    type: 'assessment',
    status: 'active',
    patientId: 'joe',
    metadata: { delegateMode: 'solo' }
};
const callLightTask = {
    id: 't-call',
    name: 'Call light — water',
    duration: 8,
    type: 'assessment',
    status: 'active',
    patientId: 'joe',
    metadata: { nurseAlert: true, alertChannel: 'callLights', delegateMode: 'solo' }
};
if (getDelegateMode(turnTask) !== 'team') fail('turn → team');
if (getDelegateMode(soloTask) !== 'solo') fail('linen → solo');
if (!isTurnCareTask(turnTask)) fail('isTurnCareTask');
if (!isCallLightTask(callLightTask)) fail('isCallLightTask');
if (getDelegateMode(callLightTask) !== 'solo') fail('call light → solo');
const cnaAide = floor.aides.find((a) => a.patientIds.includes('joe')) || floor.aides[0];
const cnaCheck = canAidePerformTask(
    { ...cnaAide, patientIds: ['joe'] },
    callLightTask,
    cnaAide.availableFrom
);
if (!cnaCheck.ok || cnaCheck.mode !== 'solo') fail('floor CNA should solo call light');
const cctCheck = canAidePerformTask(
    { ...icu.aides[0], role: 'cct', patientIds: ['joe'] },
    callLightTask,
    1930
);
if (cctCheck.ok) fail('ICU CCT must not solo call lights');

resetClassInteractions();
const assisted = withTeamAssist(turnTask, floor.aides[0]);
const resolved = resolveEffectiveDuration(assisted, null);
if (resolved.duration !== 5) fail(`team duration expected 5, got ${resolved.duration}`);

const patients = new Map([['joe', { id: 'joe', room: 'Room 201-A' }]]);
const label = formatAideLabel(
    { role: 'cna', roleLabel: 'CNA', name: 'Wendy', patientIds: ['joe'] },
    patients
);
if (label !== 'CNA Wendy · 201-A') fail(`label ${label}`);

const appJs = fs.readFileSync(path.join(root, 'game/assets/js/app.js'), 'utf8');
if (!appJs.includes('handleDelegateTaskClick')) fail('missing handleDelegateTaskClick');
if (!appJs.includes('performDelegatedSolo')) fail('missing performDelegatedSolo');
const rightMenu = fs.readFileSync(path.join(root, 'game/assets/js/right-menu.js'), 'utf8');
if (!rightMenu.includes('selectAide')) fail('right-menu missing selectAide');
const catalog = cfg.soloRequestCatalog || [];
const needed = ['bathroom', 'water', 'bed-position', 'pillow', 'linen'];
for (const id of needed) {
    if (!catalog.some((s) => s.id === id)) fail(`soloRequestCatalog missing ${id}`);
}
const patientsJs = fs.readFileSync(path.join(root, 'game/assets/js/patients.js'), 'utf8');
if (!patientsJs.includes('buildSoloRequestTasks')) fail('missing buildSoloRequestTasks');
if (!patientsJs.includes('mountSoloRequestTasks')) fail('missing mountSoloRequestTasks');

console.log('PASS E13 delegation', {
    thirds: floor.aides.map((a) => a.thirdIndex),
    teamDuration: resolved.duration,
    soloCatalog: catalog.map((s) => s.id),
    modes: Object.keys(cfg.modes)
});
